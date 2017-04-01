$("document").ready(function() {
	console.log("ui loaded");


	$("#import-markdown").click(function() {
		console.log("import as markdown");
		var text = $("#output-field").val();
		fromMarkdown(text);
		console.log(text);
	});

	$("#save").click(save);
	$("#load").click(load);

	process();

});

function createCyto(data) {

	var cy = cytoscape({


		container: document.getElementById('cy'),
		elements: data,
		style: [{
			selector: 'node',
			style: {
				'height': 40,
				'width': 40,
				'text-halign': 'center',
				'text-valign': 'center',
				'background-color': '#ccc',
				'label': 'data(name)',
				'text-background-opacity': 1,
				'text-background-color': '#ccc',
				'text-background-shape': 'roundrectangle',
				'text-border-color': '#ccc',
				'text-border-width': 5,
				'text-border-opacity': 1
			},
		}, {
			selector: '.author',
			style: {
				'height': 40,
				'width': 40,
				'text-halign': 'center',
				'text-valign': 'center',
				'background-color': '#fc9',
				'label': 'data(name)',
				'text-background-opacity': 1,
				'text-background-color': '#fc9',
				'text-background-shape': 'roundrectangle',
				'text-border-color': '#fc9',
				'text-border-width': 5,
				'text-border-opacity': 1
			},
		}, {
			selector: '.year',
			style: {
				'height': 40,
				'width': 40,
				'text-halign': 'center',
				'text-valign': 'center',
				'background-color': '#9ff',
				'label': 'data(name)',
				'text-background-opacity': 1,
				'text-background-color': '#9ff',
				'text-background-shape': 'roundrectangle',
				'text-border-color': '#9ff',
				'text-border-width': 5,
				'text-border-opacity': 1
			},
		}]

	});

var range = 30;
	cy.layout({
		name: 'cola',
		
		animate: true, // whether to show the layout as it's running
		refresh: 1, // number of ticks per frame; higher is faster but more jerky
		maxSimulationTime: 40000, // max length in ms to run the layout
		ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
		fit: true, // on every layout reposition of nodes, fit the viewport
		padding: 30, // padding around the simulation
		//boundingBox: {x1: -range, y1:-range, x2:range, y2:range }, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }

		// layout event callbacks
		ready: function() {}, // on layoutready
		stop: function() {}, // on layoutstop

		// positioning options
		randomize: false, // use random node positions at beginning of layout
		avoidOverlap: true, // if true, prevents overlap of node bounding boxes
		handleDisconnected: true, // if true, avoids disconnected components from overlapping
		nodeSpacing: function(node) {
			return 10;
		}, // extra spacing around nodes
		flow: undefined, // use DAG/tree flow layout if specified, e.g. { axis: 'y', minSeparation: 30 }
		alignment: undefined, // relative alignment constraints on nodes, e.g. function( node ){ return { x: 0, y: 1 } }

		// different methods of specifying edge length
		// each can be a constant numerical value or a function like `function( edge ){ return 2; }`
		edgeLength: undefined, // sets edge length directly in simulation
		edgeSymDiffLength: undefined, // symmetric diff edge length in simulation
		edgeJaccardLength: undefined, // jaccard edge length in simulation

		// iterations of cola algorithm; uses default values on undefined
		unconstrIter: undefined, // unconstrained initial layout iterations
		userConstIter: undefined, // initial layout iterations with user-specified constraints
		allConstIter: undefined, // initial layout iterations with all constraints including non-overlap

		// infinite layout options
		infinite: false // overrides all other options for a forces-all-the-time mode
	});

}

function save() {
	console.log("save");
	var json = currentDocument.toJSON();
	console.log(json);

	localStorage.setItem(currentDocument.name, json);
}

function load() {
	var found = localStorage.getItem(currentDocument.name);
	console.log("load", found);
}