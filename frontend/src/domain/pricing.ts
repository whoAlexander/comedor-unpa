// Patrón Factory Method: único punto del sistema donde se define el precio de una vianda.
import type { Role } from "./types";

export abstract class PriceCalculator {
  abstract readonly profileLabel: string;
  abstract calculate(): number;
}

class StudentPriceCalculator extends PriceCalculator {
  readonly profileLabel = "Estudiante";
  calculate() {
    return 2050;
  }
}

class StaffPriceCalculator extends PriceCalculator {
  readonly profileLabel = "Docente/Nodocente";
  calculate() {
    return 4100;
  }
}

class StaffWithoutContainerPriceCalculator extends PriceCalculator {
  readonly profileLabel = "Docente/Nodocente sin recipiente";
  calculate() {
    return 4500;
  }
}

export class PriceCalculatorFactory {
  static create(role: Role, withContainer = true): PriceCalculator {
    if (role === "estudiante") return new StudentPriceCalculator();
    if (role === "docente") {
      return withContainer ? new StaffPriceCalculator() : new StaffWithoutContainerPriceCalculator();
    }
    throw new Error(`El perfil "${role}" no es comensal y no tiene precio asociado.`);
  }
}

export const priceFor = (role: Role, withContainer = true) =>
  PriceCalculatorFactory.create(role, withContainer).calculate();

/** Lista de precios por perfil (para mostrar en menús y formularios). */
export const PRICE_TABLE = [
  PriceCalculatorFactory.create("estudiante"),
  PriceCalculatorFactory.create("docente", true),
  PriceCalculatorFactory.create("docente", false),
].map((c) => ({ label: c.profileLabel, price: c.calculate() }));

/** Precios aplicables al perfil de un comensal. */
export const dinerPrices = (role: Role) =>
  role === "docente"
    ? [
        { label: "con recipiente", price: priceFor("docente", true) },
        { label: "sin recipiente", price: priceFor("docente", false) },
      ]
    : [{ label: "Estudiante", price: priceFor("estudiante") }];

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const formatARS = (n: number) => ars.format(n);
