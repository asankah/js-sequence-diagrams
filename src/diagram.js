/** js sequence diagrams
 *  http://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2013 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
	/*global grammar _ */

	function Diagram() {
		this.title   = undefined;
		this.actors  = [];
		this.signals = [];
	}

	/*
	 * Return an existing actor with this alias, or creates a new one with alias and name.
	 */
	Diagram.prototype.getActor = function(alias, name, attributes) {
		alias = alias.trim();

		var i, actors = this.actors;
		for (i in actors) {
			if (actors[i].alias == alias)
				return actors[i];
		}
		i = actors.push( new Diagram.Actor(alias, (name || alias), actors.length, attributes) );
		return actors[ i - 1 ];
	};

	Diagram.prototype.setTitle = function(title) {
		this.title = title;
	};

	Diagram.prototype.addSignal = function(signal) {
                if (signal.type == "Signal") {
                  this.addExecutionOccurrence(signal.executionA, signal);
                  this.addExecutionOccurrence(signal.executionB, signal);
                }
		this.signals.push( signal );
	};

        Diagram.prototype.addInteractionList = function(interactions) {
          assert(_.isArray(interactions));
          var self = this;
          _.each(interactions, function(interaction) {
            self.addSignal(interaction);

            if (interaction.type == "Interaction") {
              var children = interaction.interactions;
              var padding = {'type': 'Padding', 'message': ''};
              delete interaction.interactions;
              interaction.lastChild = padding;
              self.addInteractionList(children);
              self.signals.push(padding);
            }
          });
        };

        Diagram.prototype.addExecutionOccurrence = function(execution, signal) {
                var actor = execution.actor;
                if (execution.execution == Diagram.EXECUTION.START) {
                  var g = new Diagram.ExecutionSpecification(signal, actor.openExecutionSpecifications.length);
                  actor.openExecutionSpecifications.push(g);
                } else if (execution.execution == Diagram.EXECUTION.FINISH) {
                  assert(actor.openExecutionSpecifications.length > 0, "Closing execution that doesn't exist");
                  var h = actor.openExecutionSpecifications.pop();
                  h.signalB = signal;
                  actor.executionSpecifications.unshift(h);
                }
        };

	Diagram.Actor = function(alias, name, index, attributes) {
		this.alias = alias;
		this.name  = name;
		this.index = index;
                this.attributes = attributes;
                this.executionSpecifications = [];
                this.openExecutionSpecifications = [];
	};

	Diagram.Signal = function(executionA, signaltype, executionB, message) {
		this.type       = "Signal";
		this.actorA     = executionA.actor;
                this.executionA = executionA;
		this.actorB     = executionB.actor;
                this.executionB = executionB;
		this.linetype   = signaltype & 3;
		this.arrowtype  = (signaltype >> 2) & 3;
		this.message    = message;
	};

        Diagram.ExecutionSpecification = function(signalA, level) {
                this.signalA = signalA;
                this.signalB = undefined;
                this.level = level;
        };

        Diagram.ExecutionOccurrence = function(actor, execution) {
                this.actor = actor;
                this.execution = execution;
        };

	Diagram.Signal.prototype.isSelf = function() {
		return this.actorA.index == this.actorB.index;
	};

	Diagram.Note = function(actor, placement, message, attributes) {
		this.type      = "Note";
		this.actor     = actor;
		this.placement = placement;
		this.message   = message;
                this.attributes = attributes;

		if (this.hasManyActors() && actor[0] == actor[1]) {
			throw new Error("Note should be over two different actors");
		}
	};

        Diagram.Interaction = function(message, attributes, interactions) {
          this.type = "Interaction";
          this.message = message;
          this.attributes = attributes;
          this.interactions = interactions;
          this.firstChild = undefined;
          this.lastChild = undefined;
        };

	Diagram.Note.prototype.hasManyActors = function() {
		return _.isArray(this.actor);
	};

	Diagram.unescape = function(s) {
		// Turn "\\n" into "\n"
		return s.trim().replace(/^"(.*)"$/m, "$1").replace(/\\n/gm, "\n");
	};

	Diagram.LINETYPE = {
		SOLID  : 0,
		DOTTED : 1
	};

	Diagram.ARROWTYPE = {
		FILLED  : 0,
		OPEN    : 1
	};

	Diagram.PLACEMENT = {
		LEFTOF  : 0,
		RIGHTOF : 1,
		OVER    : 2
	};

        // ExecutionOccurrenceSepecifications
        Diagram.EXECUTION = {
                NONE    : -1,
                START   : 0,
                FINISH  : 1
        };
                


	// Some older browsers don't have getPrototypeOf, thus we polyfill it
	// https://github.com/bramp/js-sequence-diagrams/issues/57
	// https://github.com/zaach/jison/issues/194
	// Taken from http://ejohn.org/blog/objectgetprototypeof/
	if ( typeof Object.getPrototypeOf !== "function" ) {
		/* jshint -W103 */
		if ( typeof "test".__proto__ === "object" ) {
			Object.getPrototypeOf = function(object){
				return object.__proto__;
			};
		} else {
			Object.getPrototypeOf = function(object){
				// May break if the constructor has been tampered with
				return object.constructor.prototype;
			};
		}
		/* jshint +W103 */
	}

	/** The following is included by preprocessor */
	// #include "build/grammar.js"

	/**
	 * jison doesn't have a good exception, so we make one.
	 * This is brittle as it depends on jison internals
	 */
	function ParseError(message, hash) {
		_.extend(this, hash);

		this.name = "ParseError";
		this.message = (message || "");
	}
	ParseError.prototype = new Error();
	Diagram.ParseError = ParseError;

	Diagram.parse = function(input) {
		// Create the object to track state and deal with errors
		parser.yy = new Diagram();
		parser.yy.parseError = function(message, hash) {
			throw new ParseError(message, hash);
		};

		// Parse
		var diagram = parser.parse(input);

		// Then clean up the parseError key that a user won't care about
		delete diagram.parseError;
		return diagram;
	};



