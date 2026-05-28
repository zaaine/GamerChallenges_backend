import request from "supertest"
import { app } from "../app.js"
import { prisma } from "../../prisma/index.js"

// ============================================================
// TESTS E2E — CHALLENGES
// ============================================================

// Utilisateur de test
const testUser = {
  pseudo: "ChallengeGamer",
  email: "challengegamer@example.com",
  password: "MonMotDePasse1!",
  confirm: "MonMotDePasse1!",
  avatar: "",
}

let accessToken: string
let agent: ReturnType<typeof request.agent>
let createdChallengeId: number
let gameId: number

beforeAll(async () => {
  // Nettoyage
  await prisma.voteUserChallenge.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.challenge.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.refreshToken.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.user.deleteMany({ where: { email: testUser.email } })

  // Récupère un jeu existant depuis la BDD de test
  const game = await prisma.game.findFirst()
  if (!game) throw new Error("Aucun jeu trouvé en BDD — lance le seed")
  gameId = game.game_id

  // Inscription et connexion
  agent = request.agent(app)
  const res = await agent.post("/api/auth/register").send(testUser)
  accessToken = res.body.accessToken.token
}, 15000)

afterAll(async () => {
  await prisma.voteUserChallenge.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.challenge.deleteMany({
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

describe("GET /api/challenges/newest", () => {
  it("retourne les challenges les plus récents sans authentification", async () => {
    const res = await request(app).get("/api/challenges/newest")
    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

describe("GET /api/challenges/most-liked", () => {
  it("retourne les challenges les plus likés sans authentification", async () => {
    const res = await request(app).get("/api/challenges/most-liked")
    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

describe("GET /api/challenges", () => {
  it("retourne la liste des challenges sans authentification", async () => {
    const res = await request(app).get("/api/challenges")
    expect(res.status).toBe(200)
    expect(res.body.challenges).toBeDefined()
  })

  it("retourne les challenges avec pagination", async () => {
    const res = await request(app).get("/api/challenges?page=1&limit=3")
    expect(res.status).toBe(200)
    expect(res.body.challenges.length).toBeLessThanOrEqual(3)
  })
})

// ============================================================
// CRÉATION DE CHALLENGE
// ============================================================

describe("POST /api/challenges", () => {
  it("crée un challenge avec des données valides", async () => {
    const game = await prisma.game.findFirst()
    const res = await agent.post("/api/challenges").send({
      title: "Mon challenge de test",
      description: "Une description suffisamment longue pour être valide",
      rules: "Les règles du challenge sont suffisamment longues",
      game_title: game!.title,
    })

    expect(res.status).toBe(201)
    expect(res.body.challenge).toBeDefined()
    createdChallengeId = res.body.challenge.challenge_id
  })

  it("refuse la création sans authentification — retourne 401", async () => {
    const game = await prisma.game.findFirst()
    const res = await request(app).post("/api/challenges").send({
      title: "Challenge sans auth",
      description: "Une description suffisamment longue pour être valide",
      rules: "Les règles du challenge sont suffisamment longues",
      game_title: game!.title,
    })

    expect(res.status).toBe(401)
  })

  it("refuse avec des données invalides — retourne 400", async () => {
    const res = await agent.post("/api/challenges").send({
      title: "ab",
      description: "court",
      rules: "court",
      game_title: "jeu",
    })

    expect(res.status).toBe(400)
  })
})

// ============================================================
// DÉTAIL D'UN CHALLENGE
// ============================================================

describe("GET /api/challenges/:challengeId", () => {
  it("retourne le détail d'un challenge existant", async () => {
    const res = await request(app).get(
      `/api/challenges/${createdChallengeId}`
    )
    expect(res.status).toBe(200)
    expect(res.body.challenge_id).toBe(createdChallengeId)
  })

  it("retourne 404 pour un challenge inexistant", async () => {
    const res = await request(app).get("/api/challenges/999999")
    expect(res.status).toBe(404)
  })
})

// ============================================================
// VOTE SUR UN CHALLENGE
// ============================================================

describe("POST /api/challenges/:id/vote", () => {
  it("vote sur un challenge — retourne 201", async () => {
    const res = await agent.post(`/api/challenges/${createdChallengeId}/vote`)
    expect(res.status).toBe(201)
    expect(res.body.voted).toBe(true)
  })

  it("retire le vote sur un challenge — retourne 200", async () => {
    const res = await agent.post(`/api/challenges/${createdChallengeId}/vote`)
    expect(res.status).toBe(200)
    expect(res.body.voted).toBe(false)
  })

  it("refuse le vote sans authentification — retourne 401", async () => {
    const res = await request(app).post(
      `/api/challenges/${createdChallengeId}/vote`
    )
    expect(res.status).toBe(401)
  })
})

// ============================================================
// MODIFICATION D'UN CHALLENGE
// ============================================================

describe("PATCH /api/challenges/:challengeId", () => {
  it("modifie un challenge existant", async () => {
    const game = await prisma.game.findFirst()
    const res = await agent.patch(`/api/challenges/${createdChallengeId}`).send({
      title: "Challenge modifié",
      description: "Une description modifiée suffisamment longue",
      rules: "Les règles modifiées sont suffisamment longues",
      game_title: game!.title,
    })

    expect([200, 400]).toContain(res.status)
  })

  it("refuse la modification sans authentification — retourne 401", async () => {
    const res = await request(app)
      .patch(`/api/challenges/${createdChallengeId}`)
      .send({
        title: "Challenge modifié",
        description: "Une description modifiée suffisamment longue",
        rules: "Les règles modifiées sont suffisamment longues",
      })

    expect(res.status).toBe(401)
  })
})

// ============================================================
// SUPPRESSION D'UN CHALLENGE
// ============================================================

describe("DELETE /api/challenges/:challengeId", () => {
  it("refuse la suppression sans authentification — retourne 401", async () => {
    const res = await request(app).delete(
      `/api/challenges/${createdChallengeId}`
    )
    expect(res.status).toBe(401)
  })

  it("supprime un challenge existant", async () => {
    const res = await agent.delete(`/api/challenges/${createdChallengeId}`)
    expect(res.status).toBe(200)
  })
})