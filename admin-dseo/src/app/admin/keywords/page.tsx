import Link from 'next/link'

export default function KeywordsPage() {
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Keywords</h2>
          <p className="text-gray-600">Importa y gestiona tus keywords SEO</p>
        </div>
        <Link href="/admin/keywords/import">
          <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
            Importar CSV
          </button>
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay keywords importadas</h3>
        <p className="text-gray-500 mb-4">
          Importa tus keywords desde un archivo CSV para empezar a gestionarlas
        </p>
        <Link href="/admin/keywords/import">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            Importar Keywords
          </button>
        </Link>
      </div>
    </div>
  )
}
