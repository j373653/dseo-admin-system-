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
        console.log('Processing silo:', siloData.name)
        
        // First check if silo exists
        const { data: existingSilos } = await supabase
          .from('d_seo_admin_silos')
          .select('id')
          .eq('name', siloData.name)
          .limit(1)
        
        let siloId: string | null = null
        
        if (existingSilos && existingSilos.length > 0) {
          // Use existing silo
          siloId = existingSilos[0].id
          results.silosCreated++
          console.log('Using existing silo:', siloData.name, siloId)
        } else {
          // Create new silo
          const { data: newSilo, error: siloError } = await supabase
            .from('d_seo_admin_silos')
            .insert({ name: siloData.name })
            .select('id')
            .single()
          
          if (siloError) {
            console.error('Silo insert error:', siloError)
            results.errors.push(`Error con silo ${siloData.name}: ${siloError.message}`)
            continue
          }
          
          siloId = newSilo?.id
          results.silosCreated++
          console.log('Created new silo:', siloData.name, siloId)
        }

        if (!siloId) {
          console.error('Could not get or create silo:', siloData.name)
          continue
        }

        for (const catData of (siloData.categories || [])) {
          try {
            console.log('Processing category:', catData.name, 'for silo:', siloId)
            
            // First check if category exists
            const { data: existingCats } = await supabase
              .from('d_seo_admin_categories')
              .select('id')
              .eq('silo_id', siloId)
              .eq('name', catData.name)
              .limit(1)
            
            let categoryId: string | null = null
            
            if (existingCats && existingCats.length > 0) {
              categoryId = existingCats[0].id
              results.categoriesCreated++
              console.log('Using existing category:', catData.name, categoryId)
            } else {
              const { data: newCat, error: catError } = await supabase
                .from('d_seo_admin_categories')
                .insert({ silo_id: siloId, name: catData.name })
                .select('id')
                .single()
              
              if (catError) {
                console.error('Category insert error:', catError)
                results.errors.push(`Error con categoría ${catData.name}: ${catError.message}`)
                continue
              }
              
              categoryId = newCat?.id
              results.categoriesCreated++
              console.log('Created new category:', catData.name, categoryId)
            }

            if (!categoryId) {
              console.error('Could not get or create category:', catData.name)
              continue
            }

            for (const pageData of (catData.pages || [])) {
              try {
                console.log('Processing page:', pageData.main_keyword, 'for category:', categoryId)
                
                // First check if page exists
                const { data: existingPages } = await supabase
                  .from('d_seo_admin_pages')
                  .select('id')
                  .eq('category_id', categoryId)
                  .eq('main_keyword', pageData.main_keyword)
                  .limit(1)
                
                let pageId: string | null = null
                
                if (existingPages && existingPages.length > 0) {
                  pageId = existingPages[0].id
                  results.pagesCreated++
                } else {
                  const { data: newPage, error: pageError } = await supabase
                    .from('d_seo_admin_pages')
                    .insert({
                      silo_id: siloId,
                      category_id: categoryId,
                      main_keyword: pageData.main_keyword,
                      slug: slugify(pageData.main_keyword),
                      url_target: `/${slugify(pageData.main_keyword)}`,
                      is_pillar: pageData.is_pillar || false,
                      content_type_target: pageData.type || 'blog',
                      title: pageData.main_keyword
                    })
                    .select('id')
                    .single()
                  
                  if (pageError) {
                    console.error('Page insert error:', pageError)
                    results.errors.push(`Error con página ${pageData.main_keyword}: ${pageError.message}`)
                    continue
                  }
                  
                  pageId = newPage?.id
                  results.pagesCreated++
                  console.log('Created new page:', pageData.main_keyword, pageId)
                }

                const allPageKeywords = [
                  pageData.main_keyword,
                  ...(pageData.secondary_keywords || [])
                ]

                console.log('Keywords to assign:', allPageKeywords, 'to page:', pageId)

                for (const kw of allPageKeywords) {
                  const kwLower = kw.toLowerCase().trim()
                   
                  console.log('Looking for keyword:', kwLower)
                   
                  const { data: kwData, error: kwError } = await supabase
                    .from('d_seo_admin_raw_keywords')
                    .select('id, keyword, status')
                    .ilike('keyword', kwLower)
                    .in('status', ['pending', 'clustered'])
                    .limit(1)
                    .maybeSingle()

                  if (kwError) {
                    console.error('Keyword search error:', kwError)
                  }
                   
                  console.log('Found keyword:', kwData)

                  if (kwData && pageId) {
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
                    console.log('Keyword assigned:', kw, 'to page:', pageId)
                  } else {
                    console.log('Keyword NOT found or pageId is null. kwData:', kwData, 'pageId:', pageId)
                  }
                }

              } catch (pageErr: any) {
                console.error('Page error:', pageErr)
                results.errors.push(`Error página ${pageData.main_keyword}: ${pageErr.message}`)
              }
            }

          } catch (catErr: any) {
            console.error('Category error:', catErr)
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
