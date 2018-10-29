'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subSchema = new Schema({
	mini_id: {
		type: String,
		default: "P__S__(S/L)M__"		//polarity XX, Strenth XX, Strength/Learning, Mini-statement XX
	},
	mini_statement: String,
	relate: String,
	mini_rating: Number
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
	mini_learnings: [subSchema],
	strength_rating: Number,
	learning_rating: Number,
	strength_endorsement: {
		type: Number,
		default: 0
	},
	learning_endorsement: {
		type: Number,
		default: 0
	}
});

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
	choices: [choiceSchema],
	selected: String
});

var userSchema = new Schema({
	emailID: {
		type: String,
		required: true
	},
	personal_info: {
		fullname: String,
		age: Number,
		gender: String,
		experience: {
			type: String,
			default: 'Work Experience'
		},
		profession: String,
		city: String
	},
	are_you: {
		admin: {
			type: Boolean,
			default: false
		}
	},
	important_date: {
		registration: {
			type: Date,
			default: Date.now
		},
		submission: {
			type: Date,
			default: Date.now
		}
	},
	device_details: Object,
	questionnaire: [questionS],
	polarities: [polarities],
	profile: {
		eachSectionRelate: Array,
		eachSectionShareMore: Array,
		eachSectionStopReflect: Array,
		eachSectionStopReflectDone: Array,
		eachSectionCombineComment: {
			strength: Array,
			learning: Array
		}
	},
	peer_reviewers: [new Schema({ name: String, emailid: String, relationship: String, date: Date })],
	peer_reviews: [new Schema({ emailid: String, reviews: Array, last_modified: Date, recommendation: String })],
	feedback: {
		submitted: {
			type: Boolean,
			default: false
		},
		q1: String,
		q2: String,
		q2_detailed: String,
		q3: {
			a1: Boolean,
			a2: Boolean,
			a3: Boolean,
			a4: Boolean,
			s1: String,
			s2: String,
			s3: String,
			s4: String
		},
		q4: String,
		q5: String,
		q6: String,
		q7: String
	},
	dragArray: Array
});

module.exports = mongoose.model('Users', userSchema);