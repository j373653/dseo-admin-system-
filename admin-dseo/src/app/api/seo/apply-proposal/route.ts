import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function slugify(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const { 
      proposal,
      discardKeywordIds,
      keepPendingKeywordIds
    } = await request.json()

    console.log('=== APPLY PROPOSAL DEBUG ===')
    console.log('proposal.silos:', proposal?.silos?.length)
    console.log('discardKeywordIds:', discardKeywordIds?.length)
    console.log('keepPendingKeywordIds:', keepPendingKeywordIds?.length)

    if (!proposal || !proposal.silos || proposal.silos.length === 0) {
      return NextResponse.json({ error: 'Propuesta vacía' }, { status: 400 })
    }

    const results = {
      silosCreated: 0,
      categoriesCreated: 0,
      pagesCreated: 0,
      keywordsClustered: 0,
      keywordsDiscarded: 0,
      keywordsPending: 0,
      errors: [] as string[]
    }

    await supabase.from('d_seo_admin_raw_keywords').update({ status: 'pending' })

    for (const siloData of proposal.silos) {
      try {
        const { data: silo, error: siloError } = await supabase
          .from('d_seo_admin_silos')
          .upsert({ 
            name: siloData.name,
            slug: slugify(siloData.name)
          }, { onConflict: 'name' })
          .select()
          .single()

        if (siloError) {
          results.errors.push(`Error con silo ${siloData.name}: ${siloError.message}`)
          continue
        }

        const existingSilo = await supabase
          .from('d_seo_admin_silos')
          .select('id')
          .eq('name', siloData.name)
          .single()

        if (existingSilo.data) {
          results.silosCreated++
          console.log('Silo created/updated:', siloData.name, existingSilo.data.id)
        }

        const siloId = existingSilo.data?.id

        for (const catData of (siloData.categories || [])) {
          try {
            const { data: category, error: catError } = await supabase
              .from('d_seo_admin_categories')
              .upsert({
                silo_id: siloId,
                name: catData.name,
                slug: slugify(catData.name)
              }, { onConflict: 'silo_id,name' })
              .select()
              .single()

            if (catError) {
              results.errors.push(`Error con categoría ${catData.name}: ${catError.message}`)
              continue
            }

            const existingCat = await supabase
              .from('d_seo_admin_categories')
              .select('id')
              .eq('silo_id', siloId)
              .eq('name', catData.name)
              .single()

            if (existingCat.data) {
              results.categoriesCreated++
            }

            const categoryId = existingCat.data?.id

            for (const pageData of (catData.pages || [])) {
              try {
                const { data: page, error: pageError } = await supabase
                  .from('d_seo_admin_pages')
                  .upsert({
                    silo_id: siloId,
                    category_id: categoryId,
                    main_keyword: pageData.main_keyword,
                    slug: slugify(pageData.main_keyword),
                    url_target: `/${slugify(pageData.main_keyword)}`,
                    is_pillar: pageData.is_pillar || false,
                    content_type_target: pageData.type || 'blog',
                    title: pageData.main_keyword
                  }, { onConflict: 'category_id,main_keyword' })
                  .select()
                  .single()

                if (pageError) {
                  results.errors.push(`Error con página ${pageData.main_keyword}: ${pageError.message}`)
                  continue
                }

                const existingPage = await supabase
                  .from('d_seo_admin_pages')
                  .select('id')
                  .eq('category_id', categoryId)
                  .eq('main_keyword', pageData.main_keyword)
                  .single()

                if (existingPage.data) {
                  results.pagesCreated++
                }

                const pageId = existingPage.data?.id

                const allPageKeywords = [
                  pageData.main_keyword,
                  ...(pageData.secondary_keywords || [])
                ]

                for (const kw of allPageKeywords) {
                  const kwLower = kw.toLowerCase().trim()
                  
                  const { data: kwData } = await supabase
                    .from('d_seo_admin_raw_keywords')
                    .select('id')
                    .ilike('keyword', kwLower)
                    .in('status', ['pending', 'clustered'])
                    .maybeSingle()

                  if (kwData) {
                    await supabase
                      .from('d_seo_admin_raw_keywords')
                      .update({ 
                        status: 'clustered',
                        intent: pageData.intent || 'informational'
                      })
                      .eq('id', kwData.id)

                    await supabase
                      .from('d_seo_admin_keyword_assignments')
                      .upsert({
                        keyword_id: kwData.id,
                        page_id: pageId,
                        assigned_at: new Date().toISOString()
                      }, { onConflict: 'keyword_id,page_id' })

                    results.keywordsClustered++
                  }
                }

              } catch (pageErr: any) {
                results.errors.push(`Error página ${pageData.main_keyword}: ${pageErr.message}`)
              }
            }

          } catch (catErr: any) {
            results.errors.push(`Error categoría ${catData.name}: ${catErr.message}`)
          }
        }

      } catch (siloErr: any) {
        results.errors.push(`Error silo ${siloData.name}: ${siloErr.message}`)
      }
    }

    if (discardKeywordIds && discardKeywordIds.length > 0) {
      await supabase
        .from('d_seo_admin_raw_keywords')
        .update({ 
          status: 'discarded',
          discarded_at: new Date().toISOString(),
          discarded_reason: 'Descartado por el usuario en la propuesta'
        })
        .in('id', discardKeywordIds)

      results.keywordsDiscarded = discardKeywordIds.length
    }

    if (keepPendingKeywordIds && keepPendingKeywordIds.length > 0) {
      await supabase
        .from('d_seo_admin_raw_keywords')
        .update({ status: 'pending' })
        .in('id', keepPendingKeywordIds)

      results.keywordsPending = keepPendingKeywordIds.length
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('Error in apply-proposal:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}
