export type DirectoryUser = {
  id: string
  displayName: string
  username: string
  email: string
  verified: boolean
}

// Demo-only directory to simulate "is the abuser on PersonaShield?"
export const demoDirectory: DirectoryUser[] = [
  {
    id: 'usr_01',
    displayName: 'Aarav Sharma',
    username: 'aarav.sh',
    email: 'aarav@demo.com',
    verified: true,
  },
  {
    id: 'usr_02',
    displayName: 'Riya Verma',
    username: 'riya.verma',
    email: 'riya@demo.com',
    verified: false,
  },
  {
    id: 'usr_03',
    displayName: 'Zenith Studio',
    username: 'zenith.studio',
    email: 'legal@zenith.demo',
    verified: true,
  },
]

export function searchDirectory(query: string): DirectoryUser[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return demoDirectory.filter((u) => {
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })
}

