import { PublicKey, Keypair, SystemProgram, Transaction, Connection } from "@solana/web3.js";

export interface EscrowState {
  buyer: PublicKey;
  seller: PublicKey;
  arbiter: PublicKey;
  amount: bigint;
  status: "pending" | "released" | "refunded" | "disputed";
  createdAt: number;
}

export class EscrowProgram {
  private escrows: Map<string, EscrowState> = new Map();
  private escrowCounter: number = 0;

  /**
   * Create a new escrow agreement
   */
  createEscrow(
    buyer: PublicKey,
    seller: PublicKey,
    arbiter: PublicKey,
    amount: bigint
  ): string {
    if (amount <= 0n) {
      throw new Error("Amount must be greater than 0");
    }

    const escrowId = `escrow_${this.escrowCounter++}`;
    const escrow: EscrowState = {
      buyer,
      seller,
      arbiter,
      amount,
      status: "pending",
      createdAt: Date.now(),
    };

    this.escrows.set(escrowId, escrow);
    return escrowId;
  }

  /**
   * Get escrow details
   */
  getEscrow(escrowId: string): EscrowState | null {
    return this.escrows.get(escrowId) || null;
  }

  /**
   * Release funds to seller (called by buyer or arbiter)
   */
  releaseEscrow(escrowId: string, caller: PublicKey): void {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error("Escrow not found");
    }

    if (escrow.status !== "pending") {
      throw new Error(`Cannot release escrow with status: ${escrow.status}`);
    }

    // Only buyer or arbiter can release
    if (!caller.equals(escrow.buyer) && !caller.equals(escrow.arbiter)) {
      throw new Error("Only buyer or arbiter can release funds");
    }

    escrow.status = "released";
  }

  /**
   * Refund funds to buyer (called by seller or arbiter)
   */
  refundEscrow(escrowId: string, caller: PublicKey): void {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error("Escrow not found");
    }

    if (escrow.status !== "pending") {
      throw new Error(`Cannot refund escrow with status: ${escrow.status}`);
    }

    // Only seller or arbiter can refund
    if (!caller.equals(escrow.seller) && !caller.equals(escrow.arbiter)) {
      throw new Error("Only seller or arbiter can refund");
    }

    escrow.status = "refunded";
  }

  /**
   * Mark escrow as disputed
   */
  disputeEscrow(escrowId: string, caller: PublicKey): void {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error("Escrow not found");
    }

    if (escrow.status !== "pending") {
      throw new Error(`Cannot dispute escrow with status: ${escrow.status}`);
    }

    // Only buyer or seller can initiate dispute
    if (!caller.equals(escrow.buyer) && !caller.equals(escrow.seller)) {
      throw new Error("Only buyer or seller can initiate dispute");
    }

    escrow.status = "disputed";
  }

  /**
   * Resolve dispute (called by arbiter)
   */
  resolveDispute(
    escrowId: string,
    caller: PublicKey,
    releaseToSeller: boolean
  ): void {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      throw new Error("Escrow not found");
    }

    if (escrow.status !== "disputed") {
      throw new Error("Escrow is not in disputed status");
    }

    if (!caller.equals(escrow.arbiter)) {
      throw new Error("Only arbiter can resolve disputes");
    }

    escrow.status = releaseToSeller ? "released" : "refunded";
  }

  /**
   * Get all escrows (for testing)
   */
  getAllEscrows(): Map<string, EscrowState> {
    return this.escrows;
  }

  /**
   * Clear all escrows (for testing)
   */
  clear(): void {
    this.escrows.clear();
    this.escrowCounter = 0;
  }
}
