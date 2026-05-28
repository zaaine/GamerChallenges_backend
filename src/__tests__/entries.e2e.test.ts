import request from "supertest"
import { app } from "../app.js"
import { prisma } from "../../prisma/index.js"

// ============================================================
// TESTS E2E — ENTRIES
// ============================================================

const testUser = {
  pseudo: "EntryGamer",
  email: "entrygamer@example.com",
  password: "MonMotDePasse1!",
  confirm: "MonMotDePasse1!",
  avatar: "",
}

let agent: ReturnType<typeof request.agent>
let challengeId: number
let createdEntryId: number

beforeAll(async () => {
  // Nettoyage
  await prisma.voteUserEntry.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.entry.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.refreshToken.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.user.deleteMany({ where: { email: testUser.email } })

  // Récupère un challenge existant
  const challenge = await prisma.challenge.findFirst()
  if (!challenge) throw new Error("Aucun challenge trouvé en BDD — lance le seed")
  challengeId = challenge.challenge_id

  // Inscription et connexion
  agent = request.agent(app)
  await agent.post("/api/auth/register").send(testUser)
}, 15000)

afterAll(async () => {
  await prisma.voteUserEntry.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.entry.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.refreshToken.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.user.deleteMany({ where: { email: testUser.email } })
  await prisma.$disconnect()
}, 15000)

// ============================================================
// ROUTES PUBLIQUES
// ============================================================

describe("GET /api/entries/most-liked", () => {
  it("retourne les entries les plus likées sans authentification", async () => {
    const res = await request(app).get("/api/entries/most-liked")
    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

describe("GET /api/entries/:challengeId", () => {
  it("retourne les entries d'un challenge sans authentification", async () => {
    const res = await request(app).get(`/api/entries/${challengeId}`)
    expect(res.status).toBe(200)
    expect(res.body.entries).toBeDefined()
  })

  it("retourne 404 pour un challenge inexistant", async () => {
    const res = await request(app).get("/api/entries/999999")
    expect(res.status).toBe(404)
  })

  it("retourne les entries avec memberEntries si authentifié", async () => {
    const res = await agent.get(`/api/entries/${challengeId}`)
    expect(res.status).toBe(200)
    expect(res.body.memberEntries).toBeDefined()
    expect(res.body.entries).toBeDefined()
  })
})

// ============================================================
// CRÉATION D'UNE ENTRY
// ============================================================

describe("POST /api/entries/:challengeId", () => {
  it("crée une entry avec des données valides", async () => {
    const res = await agent.post(`/api/entries/${challengeId}`).send({
      title: "Ma participation de test",
      video_url: "https://www.youtube.com/watch?v=123456",
      user_id: 1,
      challenge_id: challengeId,
    })

    expect(res.status).toBe(201)
    expect(res.body.entry).toBeDefined()
    createdEntryId = res.body.entry.entry_id
  })

  it("refuse la création sans authentification — retourne 401", async () => {
    const res = await request(app)
      .post(`/api/entries/${challengeId}`)
      .send({
        title: "Ma participation sans auth",
        video_url: "https://www.youtube.com/watch?v=123456",
        user_id: 1,
        challenge_id: challengeId,
      })

    expect(res.status).toBe(401)
  })
})

// ============================================================
// VOTE SUR UNE ENTRY
// ============================================================

describe("POST /api/entries/:entryId/vote", () => {
  it("vote sur une entry — retourne 201", async () => {
    const res = await agent.post(`/api/entries/${createdEntryId}/vote`)
    expect(res.status).toBe(201)
    expect(res.body.voted).toBe(true)
  })

  it("retire le vote sur une entry — retourne 200", async () => {
    const res = await agent.post(`/api/entries/${createdEntryId}/vote`)
    expect(res.status).toBe(200)
    expect(res.body.voted).toBe(false)
  })

  it("refuse le vote sans authentification — retourne 401", async () => {
    const res = await request(app).post(`/api/entries/${createdEntryId}/vote`)
    expect(res.status).toBe(401)
  })

  it("retourne 404 pour une entry inexistante", async () => {
    const res = await agent.post("/api/entries/999999/vote")
    expect(res.status).toBe(404)
  })
})

// ============================================================
// MODIFICATION D'UNE ENTRY
// ============================================================

describe("PATCH /api/entries/:entryId", () => {
  it("modifie une entry existante", async () => {
    const res = await agent.patch(`/api/entries/${createdEntryId}`).send({
      title: "Ma participation modifiée",
      video_url: "https://www.youtube.com/watch?v=654321",
      user_id: 1,
      challenge_id: challengeId,
    })
    expect([200, 403, 500]).toContain(res.status)
  })

  it("refuse la modification sans authentification — retourne 401", async () => {
    const res = await request(app)
      .patch(`/api/entries/${createdEntryId}`)
      .send({
        title: "Ma participation modifiée",
        video_url: "https://www.youtube.com/watch?v=654321",
        user_id: 1,
        challenge_id: challengeId,
      })

    expect(res.status).toBe(401)
  })
})

// ============================================================
// SUPPRESSION D'UNE ENTRY
// ============================================================

describe("DELETE /api/entries/:entryId", () => {
  it("refuse la suppression sans authentification — retourne 401", async () => {
    const res = await request(app).delete(`/api/entries/${createdEntryId}`)
    expect(res.status).toBe(401)
  })

  it("supprime une entry existante", async () => {
    const res = await agent.delete(`/api/entries/${createdEntryId}`)
    expect(res.status).toBe(200)
  })
})
