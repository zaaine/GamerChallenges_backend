import { jest } from "@jest/globals"
import jwt from "jsonwebtoken"
import { verifyToken, verifyRoles } from "./authMiddleware.js"
import type { Response, NextFunction } from "express"
import type { JwtRequest } from "./authMiddleware.js"

const TEST_SECRET = process.env.JWT_SECRET as string

// ============================================================
// UTILITAIRES
// ============================================================

const mockRes = () => {
  const res = {} as unknown as Response
  ;(res as any).status = jest.fn().mockReturnValue(res)
  ;(res as any).json = jest.fn().mockReturnValue(res)
  return res
}

const mockNext = jest.fn() as unknown as NextFunction

const mockReq = (cookieToken?: string): JwtRequest => ({
  cookies: cookieToken ? { accessToken: cookieToken } : {},
} as JwtRequest)

const generateToken = (payload: object) =>
  jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" })

// ============================================================
// TESTS DE verifyToken
// ============================================================

describe("verifyToken", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("appelle next() si le token est valide", () => {
    const token = generateToken({ id: 1, role: "member" })
    const req = mockReq(token)
    const res = mockRes()

    verifyToken({ validityRequired: true })(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(req.user).toMatchObject({ id: 1, role: "member" })
  })

  it("retourne 401 si aucun token et validityRequired: true", () => {
    const req = mockReq()
    const res = mockRes()

    verifyToken({ validityRequired: true })(req, res, mockNext)

    expect((res as any).status).toHaveBeenCalledWith(401)
    expect((res as any).json).toHaveBeenCalledWith({
      message: "Utilisateur non authentifié",
    })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it("appelle next() sans token si validityRequired: false", () => {
    const req = mockReq()
    const res = mockRes()

    verifyToken({ validityRequired: false })(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(req.user).toBeNull()
  })

  it("retourne 401 si le token est invalide et validityRequired: true", () => {
    const req = mockReq("token.invalide.ici")
    const res = mockRes()

    verifyToken({ validityRequired: true })(req, res, mockNext)

    expect((res as any).status).toHaveBeenCalledWith(401)
    expect((res as any).json).toHaveBeenCalledWith({
      message: "Token invalide ou expiré",
    })
  })

  it("appelle next() avec token invalide si validityRequired: false", () => {
    const req = mockReq("token.invalide.ici")
    const res = mockRes()

    verifyToken({ validityRequired: false })(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(req.user).toBeNull()
  })

  it("retourne 401 si le token est expiré et validityRequired: true", () => {
    const token = jwt.sign({ id: 1, role: "member" }, TEST_SECRET, {
      expiresIn: "0s",
    })
    const req = mockReq(token)
    const res = mockRes()

    verifyToken({ validityRequired: true })(req, res, mockNext)

    expect((res as any).status).toHaveBeenCalledWith(401)
  })
})

// ============================================================
// TESTS DE verifyRoles
// ============================================================

describe("verifyRoles", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("appelle next() si le rôle est autorisé", () => {
    const req = mockReq() as JwtRequest
    req.user = { id: 1, role: "member" as any }
    const res = mockRes()

    verifyRoles(["member" as any])(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it("retourne 403 si le rôle n'est pas autorisé", () => {
    const req = mockReq() as JwtRequest
    req.user = { id: 1, role: "member" as any }
    const res = mockRes()

    verifyRoles(["admin" as any])(req, res, mockNext)

    expect((res as any).status).toHaveBeenCalledWith(403)
    expect((res as any).json).toHaveBeenCalledWith({
      message: "Accès refusé",
    })
    expect(mockNext).not.toHaveBeenCalled()
  })

  it("retourne 401 si req.user est null", () => {
    const req = mockReq() as JwtRequest
    req.user = null
    const res = mockRes()

    verifyRoles(["member" as any])(req, res, mockNext)

    expect((res as any).status).toHaveBeenCalledWith(401)
    expect((res as any).json).toHaveBeenCalledWith({
      message: "Utilisateur non authentifié",
    })
  })

  it("accepte plusieurs rôles autorisés", () => {
    const req = mockReq() as JwtRequest
    req.user = { id: 1, role: "admin" as any }
    const res = mockRes()

    verifyRoles(["member", "admin"] as any)(req, res, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
  })
})