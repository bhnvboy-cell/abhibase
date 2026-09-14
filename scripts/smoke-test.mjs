const BASE = 'http://localhost:3000'
let cookie = ''

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
  let data = null
  try {
    data = await res.json()
  } catch {}
  return { status: res.status, data }
}

function assert(cond, label) {
  if (!cond) {
    console.error('FAIL:', label)
    process.exitCode = 1
  } else {
    console.log('ok:', label)
  }
}

const stamp = Date.now()
const email = `smoke${stamp}@test.dev`

// unauthenticated request must be rejected
let r = await req('GET', '/api/notes')
assert(r.status === 401, 'notes blocked without session')

// signup
r = await req('POST', '/api/auth/signup', {
  email,
  password: 'password123',
  full_name: 'Smoke Tester',
})
assert(r.status === 200 && r.data.user?.email === email, 'signup works, returns user')

// me
r = await req('GET', '/api/auth/me')
assert(r.status === 200 && r.data.user?.email === email, 'me returns session user')

// duplicate signup rejected
cookie = ''
r = await req('POST', '/api/auth/signup', { email, password: 'password123' })
assert(r.status === 409 || r.status === 400, 'duplicate signup rejected')
r = await req('POST', '/api/auth/signin', { email, password: 'password123' })
assert(r.status === 200 && r.data.user?.email === email, 'signin with password works')

// wrong password rejected
cookie = ''
r = await req('POST', '/api/auth/signin', { email, password: 'wrongpass' })
assert(r.status === 401 || r.status === 400, 'wrong password rejected')
await req('POST', '/api/auth/signin', { email, password: 'password123' })

// notes
r = await req('POST', '/api/notes', { title: 'Smoke note', content: 'hello world', tags: ['test'] })
assert([200, 201].includes(r.status) && r.data.note?.id, 'note created')
const noteId = r.data.note.id
r = await req('PATCH', '/api/notes', { id: noteId, title: 'Edited note' })
assert(r.status === 200 && r.data.note?.title === 'Edited note', 'note updated')
r = await req('GET', '/api/notes')
assert(Array.isArray(r.data.notes) && r.data.notes.length >= 1, 'notes listed')
r = await req('DELETE', `/api/notes?id=${noteId}`)
assert(r.status === 200, 'note deleted')

// AI summarize (mock fallback since no key)
r = await req('POST', '/api/ai/summarize', {
  content:
    'Next.js is a React framework for building web applications. It supports server-side rendering and static generation. It also provides file based routing out of the box.',
})
assert(
  r.status === 200 && r.data.summary && Array.isArray(r.data.tags),
  'ai summarize responds (mock ok)'
)

// tasks
r = await req('POST', '/api/tasks', {
  title: 'Smoke task',
  priority: 'high',
  due_date: '2026-09-01',
})
assert([200, 201].includes(r.status) && r.data.task?.id && r.data.task.completed_at === null, 'task created')
const taskId = r.data.task.id
r = await req('PATCH', '/api/tasks', { id: taskId, status: 'done' })
assert(
  r.status === 200 && r.data.task?.status === 'done' && r.data.task.completed_at !== null,
  'task completion sets completed_at'
)

// events
r = await req('POST', '/api/events', {
  title: 'Smoke event',
  event_date: new Date().toISOString(),
})
assert([200, 201].includes(r.status) && r.data.event?.id, 'planner event created')

// habits + toggle
r = await req('POST', '/api/habits', { name: 'Read', icon: 'BookOpen', color: '#22c55e' })
assert([200, 201].includes(r.status) && r.data.habit?.id, 'habit created')
const habitId = r.data.habit.id
const today = new Date().toISOString().slice(0, 10)
r = await req('PATCH', '/api/habits', { habitId, date: today })
assert(r.status === 200 && r.data.logged === true, 'habit toggled on for today')
r = await req('PATCH', '/api/habits', { habitId, date: today })
assert(r.status === 200 && r.data.logged === false, 'habit toggled off again')

// projects
r = await req('POST', '/api/projects', {
  name: 'Smoke Project',
  description: 'e2e',
  color: 'blue',
})
assert([200, 201].includes(r.status) && typeof r.data.id === 'string', 'project created, id returned')
const projectId = r.data.id
r = await req('GET', `/api/projects/${projectId}`)
assert(
  r.status === 200 &&
    r.data.project?.name === 'Smoke Project' &&
    r.data.project.project_members?.length === 1,
  'project bundle with owner member'
)
assert((r.data.columns ?? []).length === 4, 'default 4 columns seeded')
const firstColumnId = r.data.columns[0].id

// cards
r = await req('POST', `/api/projects/${projectId}/cards`, {
  column_id: firstColumnId,
  title: 'First card',
})
assert([200, 201].includes(r.status) && r.data.ok === true, 'card created in first column')
r = await req('GET', `/api/projects/${projectId}/cards`)
const card = (r.data.cards ?? []).find((c) => c.title === 'First card')
assert(!!card, 'card appears in listing')
const cardId = card.id
r = await req('PATCH', `/api/projects/${projectId}/cards`, {
  id: cardId,
  position: 5,
})
assert(r.status === 200 && r.data.ok === true, 'card patched')

// comments
r = await req('POST', `/api/projects/${projectId}/comments`, {
  card_id: cardId,
  content: 'nice card',
})
assert([200, 201].includes(r.status) && r.data.ok === true, 'comment added')
r = await req('GET', `/api/projects/${projectId}/comments?cardId=${cardId}`)
assert(r.status === 200 && r.data.comments?.length === 1, 'comments listed')

// second user + invite by email
await req('POST', '/api/auth/signup', {
  email: `peer${stamp}@test.dev`,
  password: 'password123',
  full_name: 'Peer Tester',
})
// sign back in as owner (peer signup replaced our session cookie)
await req('POST', '/api/auth/signin', { email, password: 'password123' })
r = await req('POST', `/api/projects/${projectId}/members`, {
  email: `peer${stamp}@test.dev`,
})
assert([200, 201].includes(r.status) && r.data.ok === true, 'member invited by email')
r = await req('POST', `/api/projects/${projectId}/members`, {
  email: `peer${stamp}@test.dev`,
})
assert(r.status === 409, 'duplicate member rejected')
r = await req('POST', `/api/projects/${projectId}/members`, {
  email: `ghost${stamp}@test.dev`,
})
assert(r.status === 404, 'unknown user invite rejected')

// activity
r = await req('GET', `/api/projects/${projectId}/activity`)
assert(
  r.status === 200 &&
    Array.isArray(r.data.activities) &&
    r.data.activities.length >= 2,
  'activity feed auto-logged by server'
)

// expenses
r = await req('POST', '/api/expenses/groups', { name: 'Trip', emoji: '🏝️' })
assert([200, 201].includes(r.status) && typeof r.data.id === 'string', 'expense group created')
const groupId = r.data.id
r = await req('POST', `/api/expenses/groups/${groupId}`, {
  kind: 'member',
  email: `peer${stamp}@test.dev`,
})
assert([200, 201].includes(r.status) && r.data.ok === true, 'group member invited by email')
r = await req('GET', `/api/expenses/groups/${groupId}`)
const peerMember = (r.data.members ?? []).find(
  (m) => m.profiles?.email === `peer${stamp}@test.dev`
)
assert(!!peerMember, 'group bundle lists invited member')
const peerId = peerMember.user_id
r = await req('POST', `/api/expenses/groups/${groupId}`, {
  kind: 'expense',
  paid_by: peerId,
  description: 'Dinner',
  amount: 60,
  split_with: [peerId],
  expense_date: today,
})
assert([200, 201].includes(r.status) && r.data.ok === true, 'expense recorded')
r = await req('GET', `/api/expenses/groups/${groupId}`)
assert((r.data.expenses ?? []).some((e) => e.description === 'Dinner'), 'expense in bundle')
r = await req('POST', `/api/expenses/groups/${groupId}`, {
  kind: 'settlement',
  from_user: peerId,
  to_user: peerId,
  amount: 10,
})
assert([200, 201].includes(r.status) && r.data.ok === true, 'settlement recorded')
r = await req('GET', `/api/expenses/groups/${groupId}`)
assert((r.data.settlements ?? []).length >= 1, 'settlement in bundle')

// signout
r = await req('POST', '/api/auth/signout')
assert(r.status === 200, 'signout ok')
r = await req('GET', '/api/auth/me')
assert(r.status === 200 && r.data.user === null, 'session cleared after signout')

console.log(process.exitCode ? 'SMOKE TEST FAILED' : 'ALL SMOKE TESTS PASSED')
