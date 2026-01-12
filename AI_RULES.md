# AI Rules

## Tech Stack
- **Framework**: React 19+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Hooks (useState, useEffect)

## Development Rules

### 1. Styling & UI
- **Tailwind CSS**: Use Tailwind for all styling. Do not create .css or .module.css files unless absolutely necessary for complex animations.
- **Design System**: Follow the existing aesthetic:
  - Heavy use of `rounded-2xl` or `rounded-[2rem]` for containers.
  - Colors: Primary `emerald-600`, Backgrounds `slate-50`/`slate-100`, Text `slate-900`.
  - Spacious padding (`p-8`, `p-10`) for main content areas.
  - Uppercase, tracked text (`uppercase tracking-widest`) for labels and headers.
- **Icons**: Use `lucide-react` exclusively.

### 2. Components
- **Functional Components**: Use React Functional Components with TypeScript interfaces.
- **File Structure**: 
  - Components go in `src/components/`.
  - Pages (if any) go in `src/pages/` (though currently using state-based navigation in App.tsx).
- **Modularity**: Break down complex views into smaller components if they exceed ~200 lines.

### 3. State & Types
- **Types**: Define shared interfaces in `src/types.ts`. Avoid `any`.
- **Navigation**: Currently implemented via `activeTab` state in `App.tsx`. Maintain this pattern unless migrating to React Router.

### 4. Code Output
- **Format**: ALWAYS use `<dyad-write>` tags for code output. NEVER use markdown code blocks (```).