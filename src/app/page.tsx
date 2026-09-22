/* Intentionally empty. The home view is rendered by <Shell /> in the root
   layout, which reads the pathname — see the note in src/components/Shell.tsx
   for why the page lives there instead of here. This file still exists so "/"
   is a real, statically-rendered route. */
export default function Home() {
  return null;
}
