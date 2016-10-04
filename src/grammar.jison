/** js sequence diagrams
 *  http://bramp.github.io/js-sequence-diagrams/
 *  (c) 2012-2013 Andrew Brampton (bramp.net)
 *  Simplified BSD license.
 */
%lex

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%%

\s+               /* skip whitespace */
\#[^\r\n]*        /* skip comments */
"+"               return '+';
","               return ',';
"--"              return 'DOTLINE';
"-"               return 'LINE';
"="               return '=';
">>"              return 'OPENARROW';
">"               return 'ARROW';
"["               return 'OPENATTR';
"]"               return 'CLOSEATTR';
"as"              return 'as';
"destroy"         return 'destroy';
"end"             return 'end';
"interaction"     return 'interaction';
"left of"         return 'left_of';
"note"            return 'note';
"over"            return 'over';
"participant"     return 'participant';
"right of"        return 'right_of';
"title"           return 'title';
[^\-\+>:,\r\n\=[\]"\s]+    return 'TOKEN';
\"[^"]+\"         return 'TOKEN';
:[^\r\n\[\]]+     return 'MESSAGE';
<<EOF>>           return 'EOF';
.                 return 'INVALID';

/lex

%start start

%% /* language grammar */

start
	: document 'EOF' { return yy.parser.yy; } /* returning parser.yy is a quirk of jison >0.4.10 */
	;

document
	: title_statement participant_list interactions { yy.parser.yy.addInteractionList($3); }
	;

title_statement
	: /* empty */
	| 'title' message      { yy.parser.yy.setTitle($2);  }
	;

participant_list
	: participant_declaration participant_list
	| /* empty */
	;

interactions
	: /* empty */ { $$ = []; }
	| interactions statement_or_interaction { $$ = $1; $$.push($2); }
	;

statement_or_interaction
	: statement { $$ = $1; }
	| interaction_block { $$ = $1; }
	;

interaction_block
	: 'interaction' message attributes interactions 'end' { $$ = new Diagram.Interaction($2, $3, $4); }
	;

statement
	: signal               { $$ = $1; }
	| note_statement       { $$ = $1; }
	;

participant_declaration
	: 'participant' TOKEN attributes { $$ = yy.parser.yy.getActor(Diagram.unescape($2), undefined, $3); }
	| 'participant' TOKEN 'as' TOKEN attributes { $$ = yy.parser.yy.getActor(Diagram.unescape($4), Diagram.unescape($2), $5); }
	;

note_statement
	: 'note' placement actor message attributes  { $$ = new Diagram.Note($3, $2, $4, $5); }
	| 'note' 'over' actor_pair message attributes { $$ = new Diagram.Note($3, Diagram.PLACEMENT.OVER, $4, $5); }
	;

actor_pair
	: actor             { $$ = $1; }
	| actor ',' actor   { $$ = [$1, $3]; }
	;

placement
	: 'left_of'   { $$ = Diagram.PLACEMENT.LEFTOF; }
	| 'right_of'  { $$ = Diagram.PLACEMENT.RIGHTOF; }
	;

signal
	: execution_occurrence signaltype execution_occurrence message attributes
	{ $$ = new Diagram.Signal($1, $2, $3, $4); }
	;

execution_occurrence
	: actor { $$ = new Diagram.ExecutionOccurrence($1, Diagram.EXECUTION.NONE); }
	| execution actor { $$ = new Diagram.ExecutionOccurrence($2, $1); }
	;

execution
	: '+' { $$ = Diagram.EXECUTION.START; }
	| LINE { $$ = Diagram.EXECUTION.FINISH; }
	;

actor
	: TOKEN { $$ = yy.parser.yy.getActor(Diagram.unescape($1)); }
	;

signaltype
	: linetype arrowtype  { $$ = $1 | ($2 << 2); }
	| linetype            { $$ = $1; }
	;

linetype
	: LINE      { $$ = Diagram.LINETYPE.SOLID; }
	| DOTLINE   { $$ = Diagram.LINETYPE.DOTTED; }
	;

arrowtype
	: ARROW     { $$ = Diagram.ARROWTYPE.FILLED; }
	| OPENARROW { $$ = Diagram.ARROWTYPE.OPEN; }
	;

message
	: MESSAGE { $$ = Diagram.unescape($1.substring(1)); }
	;

attributes
        : /* empty */
	| OPENATTR attribute_list CLOSEATTR { $$ = $2; }
	;

attribute_list
	: attribute { $$ = [$1]; }
	| attribute_list ',' attribute { $1.push($3); $$ = $1; }
	;

attribute
	: TOKEN '=' TOKEN { $$ = [Diagram.unescape($1), Diagram.unescape($3)]; }
	;

%%
