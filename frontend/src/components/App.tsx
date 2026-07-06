import { Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard'
import TreeView from './TreeView'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tree/:id" element={<TreeView />} />
    </Routes>
  )
}
