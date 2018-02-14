function selection_setup() {
	
	var selection_mode = 'drag_pan_zoom';
	var svg_width = parseInt(d3.select("svg").attr("width"))
		
	var drag_pan_zoom_rect = d3.select("svg").append("rect")
		.attr("class","selection_option")
		.attr("x", svg_width-170).attr("y", 0).attr("fill-opacity",.5).attr("width", 200).attr("height", 24)
		.on("click", function() { console.log('woee'); selection_mode = 'drag_pan_zoom'; switch_mode(); });
	
	var positive_select_rect = d3.select("svg").append("rect")
		.attr("class","selection_option")
		.attr("x", svg_width-170).attr("y", 24).attr("fill-opacity",.15).attr("width", 200).attr("height", 24)
		.on("click", function() { selection_mode = 'positive_select'; switch_mode(); });

	var negative_select_rect = d3.select("svg").append("rect")
		.attr("class","selection_option")
		.attr("x", svg_width-170).attr("y", 48).attr("fill-opacity",.15).attr("width", 200).attr("height", 24)
		.on("click", function() { selection_mode = 'negative_select'; switch_mode(); });

	var deselect_rect = d3.select("svg").append("rect")
		.attr("class","selection_option")
		.attr("x", svg_width-170).attr("y", 72).attr("fill-opacity",.15).attr("width", 200).attr("height", 24)
		.on("click", function() { selection_mode = 'deselect'; switch_mode(); });

		
	d3.select("svg")
		.append("text").attr("pointer-events","none")
		.attr("class","selection_option")
		.attr("x", svg_width-160).attr("y", 16).attr("font-family", "sans-serif")
		.attr("font-size", "12px").attr("fill", "white").text("Drag/pan/zoom")
	d3.select("svg")	
		.append("text").attr("pointer-events","none")
		.attr("class","selection_option")
		.attr("x", svg_width-160).attr("y", 40).attr("font-family", "sans-serif")
		.attr("font-size", "12px").attr("fill", "yellow").text("Positive select (shift)")
	d3.select("svg")	
		.append("text").attr("pointer-events","none")
		.attr("class","selection_option")
		.attr("x", svg_width-160).attr("y", 64).attr("font-family", "sans-serif")
		.attr("font-size", "12px").attr("fill", "blue").text("Negative select (Esc+shift)")
	d3.select("svg")	
		.append("text").attr("pointer-events","none")
		.attr("class","selection_option")
		.attr("x", svg_width-160).attr("y", 88).attr("font-family", "sans-serif")
		.attr("font-size", "12px").attr("fill", "white").text("Deselect (command)")
	
	function switch_mode() {
		
		drag_pan_zoom_rect.transition(5).attr("fill-opacity", selection_mode=='drag_pan_zoom' ? .5 : 0.15);
		positive_select_rect.transition(5).attr("fill-opacity", selection_mode=='positive_select' ? .5 : 0.15);
		negative_select_rect.transition(5).attr("fill-opacity", selection_mode=='negative_select' ? .5 : 0.15);
		deselect_rect.transition(5).attr("fill-opacity", selection_mode=='deselect' ? .5 : 0.15);
		if (selection_mode != 'drag_pan_zoom') {
			svg_graph.call(zoomer)
			.on("mousedown.zoom", null)
			.on("touchstart.zoom", null)																	  
			.on("touchmove.zoom", null)																	   
			.on("touchend.zoom", null);																	   
																	 
			vis.selectAll('g.gnode')
			.on('mousedown.drag', null);

			brush.select('.background').style('cursor', 'crosshair')
			brush.call(brusher);
		}
		if (selection_mode == 'drag_pan_zoom') {
			brush.call(brusher)
			.on("mousedown.brush", null)
			.on("touchstart.brush", null)																	  
			.on("touchmove.brush", null)																	   
			.on("touchend.brush", null);																	   

			brush.select('.background').style('cursor', 'auto')
			svg_graph.call(zoomer);
		}
	}

	function keydown() {
		shiftKey = d3.event.shiftKey
		metaKey = d3.event.metaKey; // command key on a mac
		keyCode = d3.event.keyCode;
		
		if (shiftKey && keyCode != 27) { selection_mode = 'positive_select'; }
		if (shiftKey && keyCode == 27) { selection_mode = 'negative_select'; }
		if (metaKey) { selection_mode = 'deselect'; }
		switch_mode();
	}

	function keyup() {
		shiftKey = d3.event.shiftKey || d3.event.metaKey;
		ctrlKey = d3.event.ctrlKey;
		keyCode = 0;
		selection_mode = 'drag_pan_zoom';
		switch_mode();
	}
	
	d3.select("body")
		.on("keydown",keydown)
		.on("keyup", keyup);
		
	brusher = d3.svg.brush()
	.x(xScale)
	.y(yScale)
	.on("brush", function() {
		var extent = d3.event.target.extent();
		node.classed("selected", function(d) {
			inrect = (extent[0][0] <= d.x && d.x < extent[1][0]
				   && extent[0][1] <= d.y && d.y < extent[1][1]);
			if ((selection_mode == 'positive_select') || (selection_mode == 'negative_select')) {
				return d.selected = (d.selected && ! d.compared) || ((selection_mode == 'positive_select') && inrect);
			}
			if (selection_mode == 'deselect') {
				return d.selected = d.selected  && ( ! inrect);
			}
		});
		node.classed("compared", function(d) {
			inrect = (extent[0][0] <= d.x && d.x < extent[1][0]
				   && extent[0][1] <= d.y && d.y < extent[1][1]);
			if ((selection_mode == 'positive_select') || (selection_mode == 'negative_select')) {
				return d.compared = (d.compared  && ! d.selected) || ((selection_mode == 'negative_select') && inrect);
			}
			if (selection_mode == 'deselect') {
				return d.compared = d.compared && (! inrect);
			}
		});
	})
	.on("brushend", function() {
		d3.event.target.clear();
		d3.select(this).call(d3.event.target);
		count_clusters();
		if (d3.selectAll(".selected")[0].length == 0) { 
			rotation_hide();
		}
	});
	
	var brush = d3.select("#svg_graph").append("g")
	.datum(function() { return {selected: false}; })
	.attr("class", "brush");
	
	brush.call(brusher)
	.on("mousedown.brush", null)
	.on("touchstart.brush", null) 
	.on("touchmove.brush", null)
	.on("touchend.brush", null); 

	brush.select('.background').style('cursor', 'auto');

	
	
	// "(De)select All" button
	d3.select('#deselect').select('button').on("click",deselect_all);
	
	
}


function loadSelectedCells(project_directory) {
	// load selected cells if it exists
	selection_filename = project_directory + "/selected_cells.txt";
	new_selection = []
	d3.text(selection_filename, function(text) {
		text.split('\n').forEach(function(entry,index,array) {
			if (entry != '') {
				new_selection.push(parseInt(entry));				
			}
		});
		d3.selectAll(".node circle").classed("selected", function(d) { 
			if (new_selection.includes(d.name)) { 
				d.selected = true; return true;
			}
		});
	});
}
function deselect_all() {
	var selected = d3.selectAll(".selected");
	var compared = d3.selectAll(".compared");
	if (selected[0].length + compared[0].length > 0) { 
		d3.selectAll(".node circle").classed("selected", function(d) { return d.selected = false; }); 
		d3.selectAll(".node circle").classed("compared", function(d) { return d.compared = false; }); 
		rotation_hide();
	}
	else { d3.selectAll(".node circle").classed("selected", function(d) {  d.selected = true; return true}); }
	count_clusters();
	
}

