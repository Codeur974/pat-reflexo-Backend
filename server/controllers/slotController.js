const Slot = require("../database/models/slotModel");
const createTransporter = require("../utils/emailTransporter");

const SLOT_TIMES = ["09:00", "10:00", "11:00", "12:00"];
const MAX_SLOTS_PER_TIME = 2; // nombre max de personnes reçues en même temps sur un créneau

const toMidnight = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

// POST /api/v1/slots (admin) — body: { date }
exports.createDay = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({
        status: "error",
        message: "Une date valide est requise.",
      });
    }

    const day = toMidnight(date);

    const created = [];
    for (const time of SLOT_TIMES) {
      const slot = await Slot.findOneAndUpdate(
        { date: day, time },
        { $setOnInsert: { date: day, time, status: "available" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      created.push(slot.toObject());
    }

    res.status(201).json({ status: "success", slots: created });
  } catch (error) {
    console.error("Erreur createDay:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la création de la demi-journée.",
    });
  }
};

// DELETE /api/v1/slots/:id (admin)
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ status: "error", message: "Créneau introuvable." });
    }
    if (slot.status !== "available") {
      return res.status(400).json({
        status: "error",
        message: "Impossible de supprimer un créneau déjà réservé.",
      });
    }
    await slot.deleteOne();
    res.json({ status: "success", message: "Créneau supprimé." });
  } catch (error) {
    console.error("Erreur deleteSlot:", error);
    res.status(500).json({ status: "error", message: "Erreur lors de la suppression." });
  }
};

// DELETE /api/v1/slots/day (admin) — body: { date }
// Supprime en une fois tous les créneaux encore disponibles (non réservés) d'une demi-journée
exports.deleteDay = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({
        status: "error",
        message: "Une date valide est requise.",
      });
    }

    const day = toMidnight(date);
    const result = await Slot.deleteMany({ date: day, status: "available" });
    res.json({ status: "success", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Erreur deleteDay:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la suppression de la demi-journée.",
    });
  }
};

// POST /api/v1/slots/undouble-day (admin) — body: { date }
// Retire la 2e place ajoutée pour une collègue sur les créneaux d'une demi-journée,
// uniquement là où cette 2e place est encore libre (pas déjà réservée par un client)
exports.undoubleDay = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({
        status: "error",
        message: "Une date valide est requise.",
      });
    }

    const day = toMidnight(date);
    const daySlots = await Slot.find({ date: day });

    let removedCount = 0;
    const skippedTimes = [];
    for (const time of SLOT_TIMES) {
      const slotsForTime = daySlots.filter((s) => s.time === time);
      if (slotsForTime.length < 2) continue;

      const removable = slotsForTime.find((s) => s.status === "available");
      if (removable) {
        await removable.deleteOne();
        removedCount += 1;
      } else {
        skippedTimes.push(time);
      }
    }

    res.json({ status: "success", removedCount, skippedTimes });
  } catch (error) {
    console.error("Erreur undoubleDay:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors du retrait de la 2e place.",
    });
  }
};

// POST /api/v1/slots/duplicate-day (admin) — body: { date }
// Ouvre une 2e place sur tous les créneaux d'une demi-journée déjà ouverte
// (ex: une collègue vient aider Patricia toute la demi-journée)
exports.duplicateDay = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({
        status: "error",
        message: "Une date valide est requise.",
      });
    }

    const day = toMidnight(date);
    const existingSlots = await Slot.find({ date: day });
    if (existingSlots.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Aucune demi-journée ouverte à cette date.",
      });
    }

    const created = [];
    for (const time of SLOT_TIMES) {
      const countForTime = existingSlots.filter((s) => s.time === time).length;
      if (countForTime > 0 && countForTime < MAX_SLOTS_PER_TIME) {
        const slot = await Slot.create({ date: day, time, status: "available" });
        created.push(slot.toObject());
      }
    }

    res.status(201).json({ status: "success", slots: created });
  } catch (error) {
    console.error("Erreur duplicateDay:", error);
    res.status(500).json({ status: "error", message: "Erreur lors du doublement de la demi-journée." });
  }
};

// GET /api/v1/slots — public, créneaux à venir sans les infos client
exports.getPublicSlots = async (req, res) => {
  try {
    const today = toMidnight(new Date());
    const slots = await Slot.find({ date: { $gte: today } })
      .select("date time status")
      .sort({ date: 1, time: 1 });
    res.json({ status: "success", slots: slots.map((s) => s.toObject()) });
  } catch (error) {
    console.error("Erreur getPublicSlots:", error);
    res.status(500).json({ status: "error", message: "Erreur lors de la récupération des créneaux." });
  }
};

// GET /api/v1/slots/pending (admin)
exports.getPendingSlots = async (req, res) => {
  try {
    const slots = await Slot.find({ status: "pending" }).sort({ date: 1, time: 1 });
    res.json({ status: "success", slots: slots.map((s) => s.toObject()) });
  } catch (error) {
    console.error("Erreur getPendingSlots:", error);
    res.status(500).json({ status: "error", message: "Erreur lors de la récupération des demandes." });
  }
};

// GET /api/v1/slots/confirmed (admin) — RDV confirmés à venir
exports.getConfirmedSlots = async (req, res) => {
  try {
    const today = toMidnight(new Date());
    const slots = await Slot.find({ status: "confirmed", date: { $gte: today } }).sort({
      date: 1,
      time: 1,
    });
    res.json({ status: "success", slots: slots.map((s) => s.toObject()) });
  } catch (error) {
    console.error("Erreur getConfirmedSlots:", error);
    res.status(500).json({ status: "error", message: "Erreur lors de la récupération des rendez-vous confirmés." });
  }
};

const MIN_MONTHS_BETWEEN_APPOINTMENTS = 3;

// Vérifie que le client ne reprenne pas RDV moins de 2 mois après son dernier RDV confirmé
const checkRebookingDelay = async (phone, requestedDate) => {
  const lastConfirmed = await Slot.findOne({
    status: "confirmed",
    "client.phone": phone,
    date: { $lte: requestedDate },
  }).sort({ date: -1 });

  if (!lastConfirmed) return null;

  const nextAllowedDate = new Date(lastConfirmed.date);
  nextAllowedDate.setMonth(nextAllowedDate.getMonth() + MIN_MONTHS_BETWEEN_APPOINTMENTS);

  if (requestedDate < nextAllowedDate) {
    const formattedNextAllowed = nextAllowedDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `Vous avez déjà un rendez-vous confirmé récent. Merci de reprendre rendez-vous à partir du ${formattedNextAllowed}.`;
  }

  return null;
};

// POST /api/v1/slots/:id/book — public
exports.bookSlot = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    if (!firstName || !lastName || !phone) {
      return res.status(400).json({
        status: "error",
        message: "Nom, prénom et téléphone sont requis.",
      });
    }

    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ status: "error", message: "Créneau introuvable." });
    }
    if (slot.status !== "available") {
      return res.status(409).json({
        status: "error",
        message: "Ce créneau vient d'être pris, merci d'en choisir un autre.",
      });
    }

    const rebookingError = await checkRebookingDelay(phone, slot.date);
    if (rebookingError) {
      return res.status(409).json({ status: "error", message: rebookingError });
    }

    slot.status = "pending";
    slot.client = { firstName, lastName, phone };
    await slot.save();

    try {
      const transporter = createTransporter();
      const formattedDate = new Date(slot.date).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
        subject: `Nouvelle demande de RDV - ${firstName} ${lastName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #5fd7b0, #4fc3f7); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📅 Nouvelle demande de rendez-vous</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #5fd7b0;">
                  <div style="font-weight: bold; color: #3d9b86; font-size: 14px; text-transform: uppercase;">Date et heure</div>
                  <div style="color: #5a7a8f; font-size: 16px;">${formattedDate} à ${slot.time}</div>
                </div>
                <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #5fd7b0;">
                  <div style="font-weight: bold; color: #3d9b86; font-size: 14px; text-transform: uppercase;">Client</div>
                  <div style="color: #5a7a8f; font-size: 16px;">${firstName} ${lastName}</div>
                </div>
                <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #4fc3f7;">
                  <div style="font-weight: bold; color: #3d9b86; font-size: 14px; text-transform: uppercase;">Téléphone</div>
                  <div style="color: #5a7a8f; font-size: 16px;"><a href="tel:${phone}" style="color: #0288d1;">${phone}</a></div>
                </div>
                <p style="color: #5a7a8f;">Rendez-vous dans l'espace admin pour confirmer ou refuser cette demande.</p>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de notification RDV:", emailError);
    }

    res.status(200).json({ status: "success", message: "Votre demande a bien été envoyée.", slot: slot.toObject() });
  } catch (error) {
    console.error("Erreur bookSlot:", error);
    res.status(500).json({ status: "error", message: "Erreur lors de la réservation." });
  }
};

// PATCH /api/v1/slots/:id/confirm (admin)
exports.confirmSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ status: "error", message: "Créneau introuvable." });
    }
    if (slot.status !== "pending") {
      return res.status(400).json({ status: "error", message: "Ce créneau n'est pas en attente." });
    }
    slot.status = "confirmed";
    await slot.save();
    res.json({ status: "success", slot: slot.toObject() });
  } catch (error) {
    console.error("Erreur confirmSlot:", error);
    res.status(500).json({ status: "error", message: "Erreur lors de la confirmation." });
  }
};

// PATCH /api/v1/slots/:id/refuse (admin)
exports.refuseSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ status: "error", message: "Créneau introuvable." });
    }
    if (slot.status !== "pending") {
      return res.status(400).json({ status: "error", message: "Ce créneau n'est pas en attente." });
    }
    slot.status = "available";
    slot.client = { firstName: null, lastName: null, phone: null };
    await slot.save();
    res.json({ status: "success", slot: slot.toObject() });
  } catch (error) {
    console.error("Erreur refuseSlot:", error);
    res.status(500).json({ status: "error", message: "Erreur lors du refus." });
  }
};
