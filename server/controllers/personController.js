import { dbService } from '../services/dbService.js';
import { demoPeople } from '../data/demoData.js';

export const personController = {
  async getAllPeople(req, res) {
    try {
      const people = await dbService.getAllPeople();
      res.json({ success: true, count: people.length, data: people });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getPersonById(req, res) {
    try {
      const { id } = req.params;
      const person = await dbService.getPersonById(id);
      if (!person) {
        return res.status(404).json({ success: false, error: `Person with ID '${id}' not found.` });
      }
      res.json({ success: true, data: person });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createPerson(req, res) {
    try {
      const { personId, name, waitingTime, urgency, appointmentStatus, specialRequirement, arrivalTime } = req.body;

      // Validation
      if (!personId || typeof personId !== 'string' || !personId.trim()) {
        return res.status(400).json({ success: false, error: 'Person ID is required and must be non-empty.' });
      }
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Person name is required.' });
      }
      const wait = parseInt(waitingTime, 10);
      if (isNaN(wait) || wait < 0) {
        return res.status(400).json({ success: false, error: 'Waiting time must be a non-negative number of minutes.' });
      }

      const validUrgencies = ['low', 'medium', 'high'];
      if (urgency && !validUrgencies.includes(urgency)) {
        return res.status(400).json({ success: false, error: `Urgency must be one of: ${validUrgencies.join(', ')}` });
      }

      const validStatuses = ['scheduled', 'walkin', 'missed'];
      if (appointmentStatus && !validStatuses.includes(appointmentStatus)) {
        return res.status(400).json({ success: false, error: `Appointment status must be one of: ${validStatuses.join(', ')}` });
      }

      const validSpecial = ['none', 'elderly', 'disability', 'emergency', 'other'];
      if (specialRequirement && !validSpecial.includes(specialRequirement)) {
        return res.status(400).json({ success: false, error: `Special requirement must be one of: ${validSpecial.join(', ')}` });
      }

      const newPerson = await dbService.createPerson({
        personId: personId.trim(),
        name: name.trim(),
        waitingTime: wait,
        urgency: urgency || 'low',
        appointmentStatus: appointmentStatus || 'walkin',
        specialRequirement: specialRequirement || 'none',
        arrivalTime: arrivalTime && arrivalTime.trim() ? arrivalTime.trim() : undefined,
      });

      res.status(201).json({ success: true, message: 'Person added to queue successfully.', data: newPerson });
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        return res.status(409).json({ success: false, error: err.message });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deletePerson(req, res) {
    try {
      const { id } = req.params;
      const deleted = await dbService.deletePerson(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: `Person with ID '${id}' not found.` });
      }
      res.json({ success: true, message: `Person '${id}' removed from queue.` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async clearQueue(req, res) {
    try {
      await dbService.clearPeople();
      res.json({ success: true, message: 'All persons cleared from queue.' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async seedDemo(req, res) {
    try {
      const seeded = await dbService.seedPeople(demoPeople);
      res.json({
        success: true,
        message: 'Successfully populated 8 realistic sample queue entries showcasing all Prolog rules.',
        count: seeded.length,
        data: seeded,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
