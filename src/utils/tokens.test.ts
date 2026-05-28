import jwt from "jsonwebtoken"
import { decodeJwt, getJwtSecret, generateAuthenticationTokens, generateAccessTokenOnly } from "./tokens"

// On définit une clé secrète de test
const TEST_SECRET = process.env.JWT_SECRET as string

// Avant tous les tests, on injecte la variable d'environnement
beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET
})

// Après tous les tests, on nettoie
afterAll(() => {
  delete process.env.JWT_SECRET
})

// Utilisateur fictif qui simule un objet Prisma User
const fakeUser = {
  user_id: 1,
  role: "member",
  pseudo: "GamerPro",
  email: "gamer@example.com",
  password: "hashedpassword",
  avatar: "",
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  refresh_token: null,
  refresh_token_expires_at: null,
} as any

// ============================================================
// TESTS DE getJwtSecret
// ============================================================

describe("getJwtSecret", () => {
  it("retourne la clé secrète si elle est définie", () => {
    const secret = getJwtSecret()
    expect(secret).toBe(TEST_SECRET)
  })
})

// ============================================================
// TESTS DE generateAuthenticationTokens
// ============================================================

describe("generateAuthenticationTokens", () => {
  it("génère un accessToken et un refreshToken", () => {
    const tokens = generateAuthenticationTokens(fakeUser)
    expect(tokens.accessToken.token).toBeDefined()
    expect(tokens.refreshToken.token).toBeDefined()
  })

  it("l'accessToken expire dans 1 heure", () => {
    const tokens = generateAuthenticationTokens(fakeUser)
    expect(tokens.accessToken.expiresInMS).toBe(3600000)
  })

  it("le refreshToken expire dans 7 jours", () => {
    const tokens = generateAuthenticationTokens(fakeUser)
    expect(tokens.refreshToken.expiresInMS).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it("l'accessToken contient l'id et le rôle de l'utilisateur", () => {
    const tokens = generateAuthenticationTokens(fakeUser)
    const decoded = jwt.verify(tokens.accessToken.token, TEST_SECRET) as any
    expect(decoded.id).toBe(fakeUser.user_id)
    expect(decoded.role).toBe(fakeUser.role)
  })
})

// ============================================================
// TESTS DE generateAccessTokenOnly
// ============================================================

describe("generateAccessTokenOnly", () => {
  it("génère un accessToken valide", () => {
    const token = generateAccessTokenOnly(fakeUser)
    expect(token.token).toBeDefined()
    expect(token.type).toBe("Bearer")
    expect(token.expiresInMS).toBe(3600000)
  })
})

// ============================================================
// TESTS DE decodeJwt
// ============================================================

describe("decodeJwt", () => {
  it("retourne null si le token est vide", () => {
    const result = decodeJwt("")
    expect(result).toBeNull()
  })

  it("retourne null si le token est invalide", () => {
    const result = decodeJwt("token.invalide.ici")
    expect(result).toBeNull()
  })

  it("retourne le payload si le token est valide", () => {
    const token = jwt.sign({ id: 1, role: "member" }, TEST_SECRET)
    const result = decodeJwt(token)
    expect(result).not.toBeNull()
    expect(result?.id).toBe(1)
    expect(result?.role).toBe("member")
  })

  it("retourne null si le token est expiré", () => {
    const token = jwt.sign({ id: 1, role: "member" }, TEST_SECRET, {
      expiresIn: "0s",
    })
    const result = decodeJwt(token)
    expect(result).toBeNull()
  })

  it("retourne null si le payload ne contient pas d'id valide", () => {
    const token = jwt.sign({ id: -1, role: "member" }, TEST_SECRET)
    const result = decodeJwt(token)
    expect(result).toBeNull()
  })
})