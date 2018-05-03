var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subSchema = new Schema({
    mini_id: {
        type: String,
        default: "P__S__(S/L)M__"		//polarity XX, Strenth XX, Strength/Learning, Mini-statement XX
    },
    mini_statement: String
});

var polarities = new Schema({
	version: {
		type: String,
		default: 'v1.0'
	},
    polar_id: {
		type: String,
		defualt: 'P__S__'				//polarity XX, Strenth XX
	},
    strength: String,
    learning: String,
	mini_strengths: [subSchema],
	mini_learnings: [subSchema]
});

module.exports = mongoose.model('polarSchema', polarities);
