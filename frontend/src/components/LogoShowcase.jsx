import React from 'react'
import VibeLogoSimple, { 
  VibeLogoCircular, 
  VibeCircleOnly, 
  VibeArc, 
  VibeLogoWhite 
} from './VibeLogoSimple'

const LogoShowcase = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Logomarca Vibe - Versões Disponíveis
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Logo Circular Principal */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-6 text-gray-700">Logo Circular Principal</h3>
            <div className="space-y-4">
              <div className="flex justify-center">
                <VibeLogoCircular size="xs" />
              </div>
              <div className="flex justify-center">
                <VibeLogoCircular size="sm" />
              </div>
              <div className="flex justify-center">
                <VibeLogoCircular size="md" />
              </div>
              <div className="flex justify-center">
                <VibeLogoCircular size="lg" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Ideal para favicon, perfis e ícones
            </p>
          </div>

          {/* Logo Texto Original */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-6 text-gray-700">Logo Texto Original</h3>
            <div className="space-y-4">
              <div className="flex justify-center">
                <VibeLogoSimple size="sm" />
              </div>
              <div className="flex justify-center">
                <VibeLogoSimple size="md" />
              </div>
              <div className="flex justify-center">
                <VibeLogoSimple size="lg" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Para headers e títulos principais
            </p>
          </div>

          {/* Círculo Apenas */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-6 text-gray-700">Círculo Apenas</h3>
            <div className="space-y-4">
              <div className="flex justify-center">
                <VibeCircleOnly size="xs" />
              </div>
              <div className="flex justify-center">
                <VibeCircleOnly size="sm" />
              </div>
              <div className="flex justify-center">
                <VibeCircleOnly size="md" />
              </div>
              <div className="flex justify-center">
                <VibeCircleOnly size="lg" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Para botões e indicadores visuais
            </p>
          </div>

          {/* Logo em Fundo Escuro */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-6 text-white">Logo em Fundo Escuro</h3>
            <div className="space-y-4">
              <div className="flex justify-center">
                <VibeLogoWhite size="sm" />
              </div>
              <div className="flex justify-center">
                <VibeLogoWhite size="md" />
              </div>
              <div className="flex justify-center">
                <VibeLogoCircular size="md" />
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-4">
              Para temas escuros e contrastes
            </p>
          </div>

          {/* Comparação de Tamanhos */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center col-span-full">
            <h3 className="text-lg font-semibold mb-6 text-gray-700">Comparação de Tamanhos - Logo Circular</h3>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <VibeLogoCircular size="xs" />
                <p className="text-xs text-gray-500 mt-2">XS</p>
              </div>
              <div className="text-center">
                <VibeLogoCircular size="sm" />
                <p className="text-xs text-gray-500 mt-2">SM</p>
              </div>
              <div className="text-center">
                <VibeLogoCircular size="md" />
                <p className="text-xs text-gray-500 mt-2">MD</p>
              </div>
              <div className="text-center">
                <VibeLogoCircular size="lg" />
                <p className="text-xs text-gray-500 mt-2">LG</p>
              </div>
              <div className="text-center">
                <VibeLogoCircular size="xl" />
                <p className="text-xs text-gray-500 mt-2">XL</p>
              </div>
            </div>
          </div>

        </div>

        {/* Instruções de Uso */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Como Usar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Importação:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import VibeLogoSimple, { 
  VibeLogoCircular,
  VibeCircleOnly,
  VibeLogoWhite 
} from './components/VibeLogoSimple'`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Exemplo de Uso:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<VibeLogoCircular size="md" />
<VibeCircleOnly size="sm" />
<VibeLogoWhite size="lg" />`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogoShowcase
