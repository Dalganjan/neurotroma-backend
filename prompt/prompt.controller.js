const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const Role = require('_helpers/role');
const promptService = require('./prompt.service');

// routes
router.post('/:promptAdminId/prompts', authorize(Role.PromptAdmin), promptSchema, recordPrompt);
router.put('/:promptAdminId/prompts/:promptId', authorize(Role.PromptAdmin), promptsUpdateSchema, updatePrompt);
router.get('/:promptAdminId/prompts', authorize(Role.PromptAdmin), getAllPrompts);

module.exports = router;


function promptSchema() {
    const schema = Joi.object({
        editorPromptDetails: Joi.string().required(),
        sectionId: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function recordPrompt(req, res, next) {
    if (req.params.promptAdminId !== req.user.id && req.user.role !== Role.PromptAdmin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    promptService.recordPrompt(req.params.promptAdminId, req.body)
        .then((promptDetails) => res.json(promptDetails))
        .catch(next);
}

function promptsUpdateSchema(req, res, next) {
    const schema = Joi.object({
        editorPromptDetails: Joi.string().required(),
        sectionId: Joi.string().required(),
        isLatest: Joi.string(),
        version: Joi.number().required(),
    });
    validateRequest(req, next, schema);
}


function updatePrompt(req, res, next) {
    if (req.params.promptAdminId !== req.user.id && req.user.role !== Role.PromptAdmin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    promptService.updatePrompt(req.params.promptAdminId, req.params.promptId, req.body)
        .then((updatedPrompt) => res.json(updatedPrompt))
        .catch(next);
}


function getAllPrompts(req, res, next) {
    if (req.params.promptAdminId !== req.user.id && req.user.role !== Role.PromptAdmin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    assistantService.getAllPrompts(req.params.promptAdminId)
        .then((prompts) => res.json(prompts))
        .catch(next);
}