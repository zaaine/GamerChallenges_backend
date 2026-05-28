import { jest } from "@jest/globals"
import { controllerWrapper } from "./controllerWrapper.js"
import type { Request, Response, NextFunction } from "express"

// Faux req et next
const mockReq = {} as Request
const mockNext = jest.fn() as unknown as NextFunction

// Fonction utilitaire pour créer un faux res
const mockRes = () => {
  const res = {} as unknown as Response
  ;(res as any).status = jest.fn().mockReturnValue(res)
  ;(res as any).json = jest.fn().mockReturnValue(res)
  return res
}

describe("controllerWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("exécute le middleware sans erreur", async () => {
    const res = mockRes()
    const middleware = jest.fn().mockImplementation(async (_req: any, res: any) => {
      res.status(200).json({ message: "OK" })
    })

    await controllerWrapper(middleware as any)(mockReq, res, mockNext)

    expect((res as any).status).toHaveBeenCalledWith(200)
    expect((res as any).json).toHaveBeenCalledWith({ message: "OK" })
  })

  it("retourne une erreur 500 si le middleware lève une exception", async () => {
    const res = mockRes()
    const middleware = jest.fn().mockImplementation(async () => {
      throw new Error("Erreur inattendue")
    })

    await controllerWrapper(middleware as any)(mockReq, res, mockNext)

    expect((res as any).status).toHaveBeenCalledWith(500)
    expect((res as any).json).toHaveBeenCalledWith({
      error: "Unexpected server error. Please try again later.",
    })
  })

  it("retourne une erreur 500 si le middleware lève une erreur asynchrone", async () => {
    const res = mockRes()
    const middleware = jest.fn().mockImplementation(async () => {
      await Promise.reject(new Error("Erreur async"))
    })

    await controllerWrapper(middleware as any)(mockReq, res, mockNext)

    expect((res as any).status).toHaveBeenCalledWith(500)
    expect((res as any).json).toHaveBeenCalledWith({
      error: "Unexpected server error. Please try again later.",
    })
  })

  it("ne appelle pas next() en cas d'erreur", async () => {
    const res = mockRes()
    const middleware = jest.fn().mockImplementation(async () => {
      throw new Error("Erreur")
    })

    await controllerWrapper(middleware as any)(mockReq, res, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
  })

  it("passe bien req, res et next au middleware", async () => {
    const res = mockRes()
    const middleware = jest.fn().mockImplementation(async (_req: any, res: any) => {
      res.status(200).json({ ok: true })
    })

    await controllerWrapper(middleware as any)(mockReq, res, mockNext)

    expect(middleware).toHaveBeenCalledWith(mockReq, res, mockNext)
  })
})