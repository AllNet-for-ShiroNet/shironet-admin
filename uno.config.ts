import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      collections: {
        'material-symbols': () => import('@iconify-json/material-symbols/icons.json').then(i => i.default),
      }
    })
  ],
  theme: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      }
    }
  },
  shortcuts: {
    'card': 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300',
    'btn-primary': 'bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200',
    'sidebar-item': 'flex items-center px-4 py-3 mx-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer',
    'sidebar-item-active': 'bg-blue-500 text-white hover:bg-blue-600'
  }
})