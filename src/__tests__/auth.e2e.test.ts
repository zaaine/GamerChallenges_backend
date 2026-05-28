import request from "supertest"
import { app } from "../app.js"
import { prisma } from "../../prisma/index.js"

// ============================================================
// TESTS E2E — AUTHENTIFICATION
// Ces tests simulent un vrai client qui interagit avec l'API
// complète : route → middleware → controller → base de données
// ============================================================

// Données de test
const testUser = {
  pseudo: "TestGamer",
  email: "testgamer@example.com",
  password: "MonMotDePasse1!",
  confirm: "MonMotDePasse1!",
  avatar: "",
}

// Nettoyage de la BDD avant et après les tests
beforeAll(async () => {
  await prisma.refreshToken.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.user.deleteMany({ where: { email: testUser.email } })
})

afterAll(async () => {
  await prisma.refreshToken.deleteMany({
    where: { user: { email: testUser.email } },
  })
  await prisma.user.deleteMany({ where: { email: testUser.email } })
  await prisma.$disconnect()
})

// ============================================================
// INSCRIPTION
// ============================================================

describe("POST /api/auth/register", () => {
  it("inscrit un nouvel utilisateur avec des données valides", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser)

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(testUser.email)
    expect(res.body.user.pseudo).toBe(testUser.pseudo)
    expect(res.body.accessToken).toBeDefined()
  })

  it("refuse si l'email est déjà utilisé", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser)

    expect(res.status).toBe(409)
    expect(res.body.errors.email).toBe("Email déjà utilisé")
  })

  it("refuse si les mots de passe ne correspondent pas", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...testUser, email: "autre@example.com", confirm: "Mauvais1!" })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Les mots de passe ne correspondent pas")
  })

  it("refuse si le mot de passe est trop court", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...testUser, email: "autre2@example.com", password: "Court1!", confirm: "Court1!" })

    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

// ============================================================
// CONNEXION
// ============================================================

describe("POST /api/auth/login", () => {
  it("connecte un utilisateur avec des identifiants valides", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(testUser.email)
    expect(res.body.accessToken).toBeDefined()
    // Vérifie que le cookie httpOnly est bien positionné
    expect(res.headers["set-cookie"]).toBeDefined()
  })

  it("refuse avec un mauvais mot de passe", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: "MauvaisMotDePasse1!",
    })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe("Email et mot de passe ne correspondent pas")
  })

  it("refuse avec un email inexistant", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "inexistant@example.com",
      password: testUser.password,
    })

    expect(res.status).toBe(401)
  })

  it("refuse avec un email invalide", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "pas-un-email",
      password: testUser.password,
    })

    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

// ============================================================
// ROUTE PROTÉGÉE /me
// ============================================================

describe("GET /api/auth/me", () => {
  it("refuse l'accès sans token — retourne 401", async () => {
    const res = await request(app).get("/api/auth/me")
    expect(res.status).toBe(401)
  })

  it("retourne les infos de l'utilisateur connecté avec un token valide", async () => {
    // On se connecte d'abord pour récupérer le cookie
    const agent = request.agent(app)

    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    })

    const res = await agent.get("/api/auth/me")

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(testUser.email)
  })
})

// ============================================================
// DÉCONNEXION
// ============================================================

describe("POST /api/auth/logout", () => {
  it("déconnecte l'utilisateur et retourne 204", async () => {
    const agent = request.agent(app)

    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    })

    const res = await agent.post("/api/auth/logout")
    expect(res.status).toBe(204)
  })

  it("après déconnexion, /me retourne 401", async () => {
    const agent = request.agent(app)

    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    })

    await agent.post("/api/auth/logout")

    const res = await agent.get("/api/auth/me")
    expect(res.status).toBe(401)
  })
})