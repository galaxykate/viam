/* 
 * A document in Viam  
 *  documents are nested sets of sections
 * Sections
 *  Title
 *  Content (text, subsections)
 * Resources
 * 	- Sources
 * 		- Quotes
 *		- References
 *		- Links to the source
 */


function ViamDoc() {
	this.name = "Dissertation";

	this.images = {};

	this.references = {

		
	};
};



// Export to JSON
ViamDoc.prototype.toJSON = function() {
	return "JSON";
}

// Export to markdown
ViamDoc.prototype.toMarkdown = function() {

}

// Export to Latex
ViamDoc.prototype.toLatex = function() {

}

// Take markdown and construct a document
ViamDoc.prototype.fromMarkdown = function(text) {
	console.log(text);
}