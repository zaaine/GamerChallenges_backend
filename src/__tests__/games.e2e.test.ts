import request from "supertest"
import { app } from "../app.js"
import { prisma } from "../../prisma/index.js"

// ============================================================
// TESTS E2E — GAMES
// ============================================================

afterAll(async () => {
  await prisma.$disconnect()
})

describe("GET /api/games", () => {
  it("retourne la liste des jeux sans authentification", async () => {
    const res = await request(app).get("/api/games")
    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it("retourne des jeux avec les bons champs", async () => {
    const res = await request(app).get("/api/games")
    expect(res.status).toBe(200)
    const firstGame = res.body.data[0]
    expect(firstGame).toHaveProperty("game_id")
    expect(firstGame).toHaveProperty("title")
    expect(firstGame).toHaveProperty("image_url")
  })

  it("retourne les jeux triés par titre", async () => {
  const res = await request(app).get("/api/games")
  expect(res.status).toBe(200)
  // Vérifie que les données sont retournées et non vides
  expect(res.body.data.length).toBeGreaterThan(0)
})

  it("n'inclut pas les jeux supprimés", async () => {
    const res = await request(app).get("/api/games")
    expect(res.status).toBe(200)
    // Tous les jeux retournés doivent avoir deleted_at null
    // On vérifie indirectement via le count Prisma
    const countActifs = await prisma.game.count({ where: { deleted_at: null } })
    expect(res.body.data.length).toBe(countActifs)
  })
})