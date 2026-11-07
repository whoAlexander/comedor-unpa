Comedor Universitario UNPA-UACO — SPEC

Prototipo frontend-only (React + Tailwind + shadcn/base-ui). Todos los datos son MOCK en memoria (frontend/src/store/store.ts + seed.ts), se reinician al recargar. El backend FastAPI del template no se usa (sin endpoints de negocio). La sesión se guarda en sessionStorage (sobrevive recarga; los datos no).
Arquitectura

    src/domain/pricing.ts — Factory Method PriceCalculatorFactory.create(role, withContainer): Estudiante $2.050, Docente/Nodocente $4.100, Docente sin recipiente $4.500. Único lugar con precios.
    src/domain/reservationState.ts — State: Pendiente de pago → (submitProof/approve/reject/cancel), Pagada/Confirmada → deliver, Entregada y Cancelada terminales. Sub-estado de pago: sin_comprobante | en_revision | rechazado | aprobado. Rechazo mantiene "Pendiente de pago".
    src/lib/time.ts — hora Argentina (America/Argentina/Buenos_Aires); corte 14:00.
    src/lib/a11y.ts — preferencias de accesibilidad (escala 80–175%, claro/oscuro/alto-contraste) en localStorage unpa_uaco_a11y_prefs; clases dark/hc en <html>.

Rutas por rol

    Comensal (estudiante/docente): /inicio, /menu-semanal, /reservar, /mis-reservas, /pagos (accesible desde Mis reservas / Inicio)
    Admin: /admin, /admin/pagos, /admin/escaner, /admin/menus, /admin/reporte (botón "Generar reporte" en /admin; no está en el Navbar)
    Cocina: /cocina (demanda), /cocina/stock
    /login público; rutas de otro rol redirigen al inicio del rol propio. Panel de accesibilidad en Navbar de todas las páginas, incluido login.

Reglas

    Servicio solo de lunes a viernes. Se reserva el siguiente día hábil (nextServiceDay; el viernes reserva para el lunes) antes de 14:00 AR; sábado y domingo no se reserva. 1 por día (canceladas no cuentan), requiere menú cargado y disponible. Menús solo en días hábiles (validado en form y en saveMenu). Docente elige "No traigo recipiente".
    En /reservar hay "Simulación de horario (solo prototipo)": Hora real / Simular 10:00 / Simular 15:00.
    QR simulado solo para reservas Pagadas/Confirmadas.
    Escáner: código UACO-XXXX-XXXX o DNI (7–8 dígitos). Pagada de hoy → Entregada (banner verde grande); pendiente → rojo; entregada → aviso ya retirada; inexistente → error; pagada de otra fecha → aviso fecha incorrecta.
    Demanda de cocina: solo reservas de hoy en estado Pagada.
    Menús: no se puede eliminar/cambiar fecha con reservas activas; una por fecha.
    Reporte (src/domain/report.ts): filtra por fecha de la reserva (presets Todo/Mes/Semana/Hoy o rango Desde–Hasta). Ingresos cobrados = pagadas + entregadas; Por cobrar = pendientes de pago; también monto cancelado, ticket promedio, tasas de retiro/cancelación, ingresos por perfil (de la Factory) y por día (gráfico), estados de reserva/pago, top 5 menús, stock bajo. Exporta CSV (;, UTF-8 BOM) e Imprimir/PDF (window.print; Navbar oculto al imprimir).

Seed (relativo a hoy T, menús lun–vie desde T-3 hasta T+10; el 3.er día hábil futuro no disponible)

    Mateo Rossi (estudiante, DNI 42123456): T pagada UACO-MR7K-2Q9X, ayer entregada, anteayer cancelada. Puede reservar mañana.
    Carlos Méndez (docente, DNI 28456789): T pagada sin recipiente UACO-CM4P-8H2D; próximo día de servicio pendiente con pago RECHAZADO; ayer entregada.
    Hoy: pagadas también Lucía, Tomás, Ana Torres (docente con recipiente), Jorge Quiroga (docente sin recipiente) → demanda 6 (3 est., 3 doc., 1 con / 2 sin). Valentina entregada UACO-VR2H-8M3D, Martín pendiente sin comprobante UACO-MP3N-6T5R, Sofía cancelada.
    Próximo día: Lucía y Tomás pendientes con comprobante en revisión.
    Stock: 10 insumos; bajo mínimo: Carne vacuna, Fideos, Aceite.
