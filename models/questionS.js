var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var choiceSchema = new Schema({
    statement_id: {
		type: String,
		defualt: 'Q__C__'			//question XX, Choice XX
	},
	statement: String,
	linked: {
		type: String,
		defualt: 'P__S__'			//polarity XX, Strenth XX
	}
});

var questionS = new Schema({
	version: {
		type: String,
		default: 'v1.0'
	},
    question_id: {
		type: String,
		defualt: 'Q__'				//question XX
	},
    question: String,
    choices: [choiceSchema]
});

module.exports = mongoose.model('quesSchema', questionS);
