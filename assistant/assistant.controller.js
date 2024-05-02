const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const Role = require('_helpers/role');
const assistantService = require('./assistant.service');

// routes
router.post('/:assistantId/patients', authorize(Role.Assistant), recordPatient);
router.post('/:assistantId/patients/:patientId/sectionResults', authorize(Role.Assistant), sectionResultSchema, recordSectionWiseResults);
router.put('/:assistantId/patients/:patientId/updateSectionPromptResponse', authorize(Role.Assistant), updateSectionPrompSchema, updateSectionPromptResponse);

module.exports = router;


function recordPatient(req, res, next) {
    if (req.params.assistantId !== req.user.id && req.user.role !== Role.Assistant) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    assistantService.recordPatient(req.params.assistantId)
        .then((patientDetails) => res.json(patientDetails))
        .catch(next);
}

function sectionResultSchema(req, res, next) {
    const schema = Joi.object({
        sectionForm: Joi.string().required(),
        sectionId: Joi.string().required()
    });
    validateRequest(req, next, schema);
}


function recordSectionWiseResults(req, res, next) {
    if (req.params.assistantId !== req.user.id && req.user.role !== Role.Assistant) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    assistantService.recordSectionWiseResults(req.params.assistantId, req.params.patientId, req.body)
        .then((sectionWiseAnswers) => res.json(sectionWiseAnswers))
        .catch(next);
}

function updateSectionPrompSchema(req, res, next) {
    const schema = Joi.object({
        sectionId: Joi.string().required(),
        sectionPromptResponse: Joi.string(),
        updatedResponseSize: Joi.string(),
    });
    validateRequest(req, next, schema);
}


function updateSectionPromptResponse(req, res, next) {
    if (req.params.assistantId !== req.user.id && req.user.role !== Role.Assistant) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    assistantService.updateSectionPromptResponse(req.params.assistantId, req.params.patientId, req.body)
        .then((newPromptResponse) => res.json(newPromptResponse))
        .catch(next);
}