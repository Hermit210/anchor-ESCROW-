import { describe, it, expect, beforeEach } from "vitest";
import { PublicKey, Keypair } from "@solana/web3.js";
import { EscrowProgram } from "./escrow";

describe("EscrowProgram", () => {
  let escrow: EscrowProgram;
  let buyer: PublicKey;
  let seller: PublicKey;
  let arbiter: PublicKey;

  beforeEach(() => {
    escrow = new EscrowProgram();
    buyer = Keypair.generate().publicKey;
    seller = Keypair.generate().publicKey;
    arbiter = Keypair.generate().publicKey;
  });

  describe("createEscrow", () => {
    it("should create a new escrow with pending status", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      const escrowState = escrow.getEscrow(escrowId);

      expect(escrowState).not.toBeNull();
      expect(escrowState?.buyer).toEqual(buyer);
      expect(escrowState?.seller).toEqual(seller);
      expect(escrowState?.arbiter).toEqual(arbiter);
      expect(escrowState?.amount).toBe(1000n);
      expect(escrowState?.status).toBe("pending");
    });

    it("should reject escrow with zero amount", () => {
      expect(() => {
        escrow.createEscrow(buyer, seller, arbiter, 0n);
      }).toThrow("Amount must be greater than 0");
    });

    it("should reject escrow with negative amount", () => {
      expect(() => {
        escrow.createEscrow(buyer, seller, arbiter, -100n);
      }).toThrow("Amount must be greater than 0");
    });

    it("should generate unique escrow IDs", () => {
      const id1 = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      const id2 = escrow.createEscrow(buyer, seller, arbiter, 2000n);

      expect(id1).not.toBe(id2);
    });
  });

  describe("releaseEscrow", () => {
    it("should allow buyer to release funds", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.releaseEscrow(escrowId, buyer);

      const escrowState = escrow.getEscrow(escrowId);
      expect(escrowState?.status).toBe("released");
    });

    it("should allow arbiter to release funds", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.releaseEscrow(escrowId, arbiter);

      const escrowState = escrow.getEscrow(escrowId);
      expect(escrowState?.status).toBe("released");
    });

    it("should reject release by seller", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);

      expect(() => {
        escrow.releaseEscrow(escrowId, seller);
      }).toThrow("Only buyer or arbiter can release funds");
    });

    it("should reject release by unauthorized party", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      const unauthorized = Keypair.generate().publicKey;

      expect(() => {
        escrow.releaseEscrow(escrowId, unauthorized);
      }).toThrow("Only buyer or arbiter can release funds");
    });

    it("should reject release on non-existent escrow", () => {
      expect(() => {
        escrow.releaseEscrow("non_existent", buyer);
      }).toThrow("Escrow not found");
    });

    it("should reject release on already released escrow", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.releaseEscrow(escrowId, buyer);

      expect(() => {
        escrow.releaseEscrow(escrowId, buyer);
      }).toThrow("Cannot release escrow with status: released");
    });

    it("should reject release on refunded escrow", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.refundEscrow(escrowId, seller);

      expect(() => {
        escrow.releaseEscrow(escrowId, buyer);
      }).toThrow("Cannot release escrow with status: refunded");
    });
  });

  describe("refundEscrow", () => {
    it("should allow seller to refund", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.refundEscrow(escrowId, seller);

      const escrowState = escrow.getEscrow(escrowId);
      expect(escrowState?.status).toBe("refunded");
    });

    it("should allow arbiter to refund", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.refundEscrow(escrowId, arbiter);

      const escrowState = escrow.getEscrow(escrowId);
      expect(escrowState?.status).toBe("refunded");
    });

    it("should reject refund by buyer", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);

      expect(() => {
        escrow.refundEscrow(escrowId, buyer);
      }).toThrow("Only seller or arbiter can refund");
    });

    it("should reject refund by unauthorized party", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      const unauthorized = Keypair.generate().publicKey;

      expect(() => {
        escrow.refundEscrow(escrowId, unauthorized);
      }).toThrow("Only seller or arbiter can refund");
    });

    it("should reject refund on non-existent escrow", () => {
      expect(() => {
        escrow.refundEscrow("non_existent", seller);
      }).toThrow("Escrow not found");
    });

    it("should reject refund on already released escrow", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.releaseEscrow(escrowId, buyer);

      expect(() => {
        escrow.refundEscrow(escrowId, seller);
      }).toThrow("Cannot refund escrow with status: released");
    });
  });

  describe("disputeEscrow", () => {
    it("should allow buyer to initiate dispute", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.disputeEscrow(escrowId, buyer);

      const escrowState = escrow.getEscrow(escrowId);
      expect(escrowState?.status).toBe("disputed");
    });

    it("should allow seller to initiate dispute", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.disputeEscrow(escrowId, seller);

      const escrowState = escrow.getEscrow(escrowId);
      expect(escrowState?.status).toBe("disputed");
    });

    it("should reject dispute by arbiter", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);

      expect(() => {
        escrow.disputeEscrow(escrowId, arbiter);
      }).toThrow("Only buyer or seller can initiate dispute");
    });

    it("should reject dispute by unauthorized party", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      const unauthorized = Keypair.generate().publicKey;

      expect(() => {
        escrow.disputeEscrow(escrowId, unauthorized);
      }).toThrow("Only buyer or seller can initiate dispute");
    });

    it("should reject dispute on non-existent escrow", () => {
      expect(() => {
        escrow.disputeEscrow("non_existent", buyer);
      }).toThrow("Escrow not found");
    });

    it("should reject dispute on already released escrow", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.releaseEscrow(escrowId, buyer);

      expect(() => {
        escrow.disputeEscrow(escrowId, buyer);
      }).toThrow("Cannot dispute escrow with status: released");
    });
  });

  describe("resolveDispute", () => {
    it("should allow arbiter to resolve dispute in favor of seller", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.disputeEscrow(escrowId, buyer);
      escrow.resolveDispute(escrowId, arbiter, true);

      const escrowState = escrow.getEscrow(escrowId);
      expect(escrowState?.status).toBe("released");
    });

    it("should allow arbiter to resolve dispute in favor of buyer", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.disputeEscrow(escrowId, seller);
      escrow.resolveDispute(escrowId, arbiter, false);

      const escrowState = escrow.getEscrow(escrowId);
      expect(escrowState?.status).toBe("refunded");
    });

    it("should reject resolution by non-arbiter", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.disputeEscrow(escrowId, buyer);

      expect(() => {
        escrow.resolveDispute(escrowId, buyer, true);
      }).toThrow("Only arbiter can resolve disputes");
    });

    it("should reject resolution on non-disputed escrow", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);

      expect(() => {
        escrow.resolveDispute(escrowId, arbiter, true);
      }).toThrow("Escrow is not in disputed status");
    });

    it("should reject resolution on non-existent escrow", () => {
      expect(() => {
        escrow.resolveDispute("non_existent", arbiter, true);
      }).toThrow("Escrow not found");
    });
  });

  describe("getEscrow", () => {
    it("should return null for non-existent escrow", () => {
      const result = escrow.getEscrow("non_existent");
      expect(result).toBeNull();
    });

    it("should return escrow details", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 5000n);
      const escrowState = escrow.getEscrow(escrowId);

      expect(escrowState).not.toBeNull();
      expect(escrowState?.amount).toBe(5000n);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete happy path: create -> release", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      let state = escrow.getEscrow(escrowId);
      expect(state?.status).toBe("pending");

      escrow.releaseEscrow(escrowId, buyer);
      state = escrow.getEscrow(escrowId);
      expect(state?.status).toBe("released");
    });

    it("should handle complete refund path: create -> refund", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      let state = escrow.getEscrow(escrowId);
      expect(state?.status).toBe("pending");

      escrow.refundEscrow(escrowId, seller);
      state = escrow.getEscrow(escrowId);
      expect(state?.status).toBe("refunded");
    });

    it("should handle dispute resolution path", () => {
      const escrowId = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      escrow.disputeEscrow(escrowId, buyer);
      let state = escrow.getEscrow(escrowId);
      expect(state?.status).toBe("disputed");

      escrow.resolveDispute(escrowId, arbiter, true);
      state = escrow.getEscrow(escrowId);
      expect(state?.status).toBe("released");
    });

    it("should handle multiple concurrent escrows", () => {
      const id1 = escrow.createEscrow(buyer, seller, arbiter, 1000n);
      const id2 = escrow.createEscrow(buyer, seller, arbiter, 2000n);
      const id3 = escrow.createEscrow(buyer, seller, arbiter, 3000n);

      escrow.releaseEscrow(id1, buyer);
      escrow.refundEscrow(id2, seller);
      escrow.disputeEscrow(id3, buyer);

      expect(escrow.getEscrow(id1)?.status).toBe("released");
      expect(escrow.getEscrow(id2)?.status).toBe("refunded");
      expect(escrow.getEscrow(id3)?.status).toBe("disputed");
    });
  });
});
