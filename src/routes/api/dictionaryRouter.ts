import express from 'express';
import Dictionary from '../../class/Dictionary';
import JsonErrorResponse from '../../class/JsonErrorResponse';
import JsonResponse from '../../class/JsonResponse';
import fetch from 'node-fetch';

const DEFINITION_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

const dictionaryRouter = express.Router();

dictionaryRouter.get('/check', async (req, res) => {
	const toCheck = req.query.word as string;
	const definition = !!(req.query.definition as string);

	if (!toCheck) {
		return res
			.status(400)
			.send(
				new JsonErrorResponse('ClientError', 'no word provided').json()
			);
	}

	const isValid = Dictionary.instance.isWordValid(toCheck);

	if (definition) {
		const result = await fetch(`${DEFINITION_API_URL}/${toCheck}`);
		const json = await result.json();

		let def;
		try{
			def = json[0].meanings[0].definitions[0].definition;
		}catch(err){
			def = '';
		}

		return res.status(200).send(
			new JsonResponse({
				word: toCheck,
				isValid,
				definition: def,
			}).json()
		);
	}

	return res.status(200).send(
		new JsonResponse({
			word: toCheck,
			isValid,
		}).json()
	);
});

export default dictionaryRouter;
