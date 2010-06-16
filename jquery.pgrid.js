/*
 * jQuery Pines Grid (pgrid) Plugin 1.0
 *
 * Copyright (c) 2009 Hunter Perrin
 *
 * Licensed (along with all of Pines) under the GNU Affero GPL:
 *	  http://www.gnu.org/licenses/agpl.html
 */

(function($) {
	$.fn.pgrid_add = function(rows, row_callback) {
		if (!rows)
			return this;
		this.each(function(){
			if (!this.pines_grid)
				return;
			var pgrid = this.pines_grid;
			var new_rows = false;
			$.each(rows, function(){
				var cur_row = this;
				var jq_row = $("<tr />").attr("title", String(cur_row.key)).addClass(cur_row.classes ? cur_row.classes : "").each(function(){
					var this_row = $(this);
					if (!cur_row.values)
						return;
					$.each(cur_row.values, function(){
						this_row.append($("<td>"+String(this)+"</td>"));
					});
				});
				pgrid.children("tbody").append(jq_row);
				// Gather all the rows.
				if (new_rows)
					new_rows = new_rows.add(jq_row);
				else
					new_rows = jq_row;
			});
			// The rows need to be initialized after they've all been added, for child indentation.
			pgrid.init_rows(new_rows);

			pgrid.do_col_hiding(true);
			pgrid.do_sort(false, true);
			pgrid.do_filter(false, true);
			pgrid.paginate(true);
			pgrid.update_selected();

			if (row_callback)
				new_rows.each(row_callback);
		});
		return this;
	};
	$.fn.pgrid_delete = function(keysorrows) {
		if (keysorrows) {
			this.each(function(){
				var pgrid = this.pines_grid;
				if (!pgrid)
					return;
				if (keysorrows.jquery)
					keysorrows.each(function(){
						pgrid.mark_for_delete_recursively($(this));
					});
				else
					$.each(keysorrows, function(){
						var cur_keyorrow = this;
						if (typeof cur_keyorrow == "object") {
							pgrid.mark_for_delete_recursively($(this));
						} else {
							pgrid.children("tbody").children("tr[title="+cur_keyorrow+"]").each(function(){
								pgrid.mark_for_delete_recursively($(this));
							});
						}

					});
				// Delete the rows we just marked for deletion.
				// Marking them for deletion first prevents errors when selecting children.
				pgrid.delete_marked();
			});
		} else {
			var pgrid = this.closest("table.ui-pgrid-table").get(0);
			if (pgrid)
				pgrid = pgrid.pines_grid;
			if (!pgrid)
				return this;
			this.each(function(){
				pgrid.mark_for_delete_recursively($(this));
			});
			pgrid.delete_marked();
		}
		return this;
	};
	$.fn.pgrid_export_rows = function(rows) {
		var return_array = [];
		if (!rows)
			rows = this;
		$.each(rows, function(){
			var cur_row = $(this);
			var cur_title = cur_row.attr("title");
			var cur_class = cur_row.attr("class");
			var value_array = [];
			cur_row.children("td:not(.ui-pgrid-table-expander)").each(function(){
				value_array = $.merge(value_array, [$(this).text()]);
			});
			return_array = $.merge(return_array, [{
				key: (typeof cur_title == "undefined" ? "" : cur_title),
				classes: (typeof cur_class == "undefined" ? "" : cur_class.replace(/\bui-[a-z0-9 \-]+/, "")),
				values: value_array
			}]);
		});
		return return_array;
	};
	$.fn.pgrid_select_rows = function(keysorrows) {
		var pgrid = null;
		if (!keysorrows) {
			keysorrows = this;
			pgrid = keysorrows.closest(".ui-pgrid-table").get(0);
			if (pgrid && pgrid.pines_grid)
				pgrid = pgrid.pines_grid;
		} else {
			pgrid = this.get(0);
			if (pgrid && pgrid.pines_grid)
				pgrid = pgrid.pines_grid;
		}
		if (!pgrid)
			return this;
		if (!keysorrows.jquery) {
			if (typeof keysorrows != "object")
				return this;
			keysorrows = pgrid.children("tbody").children("tr[title='" + keysorrows.join("'], tr[title='") + "']");
		}
		if (pgrid.pgrid_select) {
			if ((pgrid.children("tbody").children("tr.ui-pgrid-table-row-selected").length || keysorrows.length > 1) && !pgrid.pgrid_multi_select)
				return this;
			keysorrows.addClass("ui-pgrid-table-row-selected ui-state-active");
			pgrid.update_selected();
		}
		return this;
	};
	$.fn.pgrid_deselect_rows = function(keysorrows) {
		var pgrid = null;
		if (!keysorrows) {
			keysorrows = this;
			pgrid = keysorrows.closest("table.ui-pgrid-table").get(0);
			if (pgrid && pgrid.pines_grid)
				pgrid = pgrid.pines_grid;
		} else {
			pgrid = this.get(0);
			if (pgrid && pgrid.pines_grid)
				pgrid = pgrid.pines_grid;
		}
		if (!pgrid)
			return this;
		if (!keysorrows.jquery) {
			if (typeof keysorrows != "object")
				return this;
			keysorrows = pgrid.children("tbody").children("tr[title='" + keysorrows.join("'], tr[title='") + "']");
		}
		if (pgrid.pgrid_select) {
			keysorrows.removeClass("ui-pgrid-table-row-selected").removeClass("ui-state-active");
			pgrid.update_selected();
		}
		return this;
	};
	$.fn.pgrid_get_all_rows = function() {
		var return_rows = false;
		this.each(function(){
			if (!this.pines_grid.jquery)
				return;
			var pgrid = this.pines_grid;
			if (return_rows)
				return_rows = return_rows.add(pgrid.children("tbody").children());
			else
				return_rows = pgrid.children("tbody").children();
		});
		return return_rows;
	};
	$.fn.pgrid_get_selected_rows = function() {
		var return_rows = false;
		this.each(function(){
			if (!this.pines_grid.jquery)
				return;
			var pgrid = this.pines_grid;
			if (return_rows)
				return_rows = return_rows.add(pgrid.children("tbody").children("tr.ui-pgrid-table-row-selected"));
			else
				return_rows = pgrid.children("tbody").children("tr.ui-pgrid-table-row-selected");
		});
		return return_rows;
	};
	$.fn.pgrid_add_descendent_rows = function() {
		var rows = $(this);
		this.filter("tr.parent").each(function(){
			var cur_row = $(this);
			var children = cur_row.siblings("."+cur_row.attr("title"));
			rows = rows.add(children.pgrid_add_descendent_rows());
		});
		return rows;
	};
	$.fn.pgrid_get_value = function(column) {
		// Only works on one row.
		var cur_row = $(this).eq(0);
		return cur_row.children("td.col_"+column).html();
	};
	$.fn.pgrid_set_value = function(column, value) {
		this.children("td.col_"+column).html(value);
	};
	$.fn.pgrid_export_state = function() {
		var pgrid = this.get(0);
		if (pgrid && pgrid.pines_grid)
			pgrid = pgrid.pines_grid;
		if (pgrid.jquery)
			return pgrid.export_state();
		return false;
	};
	$.fn.pgrid_import_state = function(state) {
		this.each(function(){
			if (!this.pines_grid) return;
			this.pines_grid.import_state(state);
		});
		return this;
	};

	$.fn.pgrid = function(options) {
		// Build main options before element iteration.
		var opts = $.extend({}, $.fn.pgrid.defaults, options);

		// Iterate and gridify each matched element.
		this.filter("table:not(.ui-pgrid-table)").each(function() {
			var pgrid = $(this);
			pgrid.pgrid_version = "1.0.0";

			pgrid.extend(pgrid, opts);

			pgrid.pgrid_pages = null;
			pgrid.pgrid_widget = $("<div />");
			pgrid.pgrid_table_container = $("<div />");
			pgrid.pgrid_header_select = $("<div />");

			// Wrap the table in a widget container.
			pgrid.wrapAll(pgrid.pgrid_widget);
			// Refresh the jQuery object.
			pgrid.pgrid_widget = pgrid.parent();
			// Detach the table from the DOM, so we can work on it locally.
			pgrid.detach();

			// Add the pgrid class to the container.
			pgrid.pgrid_widget.addClass("ui-pgrid ui-widget ui-widget-content ui-corner-all");
			// And the table container.
			pgrid.pgrid_table_container.addClass("ui-pgrid-table-container");
			// Put the grid in the container.
			pgrid.pgrid_table_container.append(pgrid);

			// Add the pgrid class.
			pgrid.addClass("ui-pgrid-table");
			if (pgrid.pgrid_select)
				pgrid.addClass("ui-pgrid-selectable");
			// All arrays and objects in our options need to be copied,
			// since they just have a pointer to the defaults if we don't.
			pgrid.pgrid_toolbar_contents = pgrid.pgrid_toolbar_contents.slice();
			pgrid.pgrid_hidden_cols = pgrid.pgrid_hidden_cols.slice();

			// If we're running on a browser that doesn't have an indexOf
			// function on the array object, create one, so we can hide columns.
			if (!pgrid.pgrid_hidden_cols.indexOf) {
				//This prototype is provided by the Mozilla foundation and
				//is distributed under the MIT license.
				//http://www.ibiblio.org/pub/Linux/LICENSES/mit.license
				pgrid.pgrid_hidden_cols.indexOf = function(elt /*, from*/) {
					var len = this.length >>> 0;

					var from = Number(arguments[1]) || 0;
					from = (from < 0) ? Math.ceil(from) : Math.floor(from);
					if (from < 0)
						from += len;

					for (; from < len; from++) {
						if (from in this && this[from] === elt)
							return from;
					}
					return -1;
				};
			}

			// Export the current state of the grid.
			pgrid.export_state = function() {
				return {
					pgrid_page: pgrid.pgrid_page,
					pgrid_perpage: pgrid.pgrid_perpage,
					pgrid_filter: pgrid.pgrid_filter,
					pgrid_hidden_cols: pgrid.pgrid_hidden_cols.slice(),
					pgrid_sort_col: pgrid.pgrid_sort_col,
					pgrid_sort_ord: pgrid.pgrid_sort_ord,
					pgrid_view_height: pgrid.pgrid_table_viewport.height()+"px"
				};
			};

			// Return the grid to a provided state.
			pgrid.import_state = function(state) {
				if (typeof state.pgrid_page !== undefined)
					pgrid.pgrid_page = state.pgrid_page;
				if (typeof state.pgrid_perpage !== undefined)
					pgrid.pgrid_perpage = state.pgrid_perpage;
				if (typeof state.pgrid_filter !== undefined)
					pgrid.pgrid_filter = state.pgrid_filter;
				if (typeof state.pgrid_hidden_cols !== undefined)
					pgrid.pgrid_hidden_cols = state.pgrid_hidden_cols.slice(0);
				if (typeof state.pgrid_sort_col !== undefined)
					pgrid.pgrid_sort_col = state.pgrid_sort_col;
				if (typeof state.pgrid_sort_ord !== undefined)
					pgrid.pgrid_sort_ord = (state.pgrid_sort_ord != "desc" ? "asc" : "desc");
				if (typeof state.pgrid_view_height !== undefined)
					pgrid.pgrid_table_viewport.css("height", state.pgrid_view_height);
				// Filter need to come first, because pagination ignores disabled records.
				pgrid.do_filter(pgrid.pgrid_filter);
				pgrid.do_sort();
				pgrid.do_col_hiding();
				if (pgrid.pgrid_footer && pgrid.pgrid_filtering)
					pgrid.footer.children("div.ui-pgrid-footer-filter-container").find("span:first-child input").val(pgrid.pgrid_filter);
				if (pgrid.pgrid_footer && pgrid.pgrid_paginate)
					pgrid.footer.children("div.ui-pgrid-footer-pager-container").find("span:first-child input").val(pgrid.pgrid_perpage);
			};

			// When the grid's state changes, call the provided function, passing the current state.
			pgrid.state_changed = function() {
				if (pgrid.pgrid_state_change)
					return pgrid.pgrid_state_change(pgrid.export_state());
				return null;
			};

			pgrid.pagestart = function() {
				// Go to the first page.
				pgrid.pgrid_page = 0;
				pgrid.paginate();
			};

			pgrid.pageprev = function() {
				// Go to the previous page.
				pgrid.pgrid_page--;
				if (pgrid.pgrid_page < 0)
					pgrid.pgrid_page = 0;
				pgrid.paginate();
			};

			pgrid.pagenext = function() {
				// Go to the next page.
				pgrid.pgrid_page++;
				if (pgrid.pgrid_page >= pgrid.pgrid_pages)
					pgrid.pgrid_page = pgrid.pgrid_pages - 1;
				pgrid.paginate();
			};

			pgrid.pageend = function() {
				// Go to the last page.
				pgrid.pgrid_page = pgrid.pgrid_pages - 1;
				pgrid.paginate();
			};

			pgrid.pagenum = function(pagenum) {
				// Change the current page.
				pgrid.pgrid_page = pagenum;
				if (isNaN(pgrid.pgrid_page) || pgrid.pgrid_page < 0)
					pgrid.pgrid_page = 0;
				else if (pgrid.pgrid_page >= pgrid.pgrid_pages)
					pgrid.pgrid_page = pgrid.pgrid_pages - 1;
				pgrid.paginate();
			};

			pgrid.set_per_page = function(new_per_page) {
				// Change the records shown per page.
				pgrid.pgrid_page = 0;
				pgrid.pgrid_perpage = new_per_page;
				if (pgrid.pgrid_perpage === 0)
					pgrid.pgrid_perpage = 1;
				pgrid.paginate();
			};

			pgrid.hide_children = function(jq_rows) {
				// For each row, hide its children.
				var parents = jq_rows.filter("tr.parent");
				if (!parents.length) return;
				parents.each(function() {
					var cur_row = $(this);
					cur_row.siblings("tr."+cur_row.attr("title")+".ui-pgrid-table-row-visible").removeClass("ui-pgrid-table-row-visible").filter("tr.parent").each(function(){
						// And its descendants, if it's a parent.
						pgrid.hide_children($(this));
					});
				});
			};

			pgrid.show_children = function(jq_rows) {
				// For each row, unhide its children. (If it's expanded.)
				var parents = jq_rows.filter("tr.parent.ui-pgrid-table-row-expanded");
				if (!parents.length) return;
				parents.each(function() {
					var cur_row = $(this);
					// If this row is expanded, its children should be shown.
					cur_row.siblings("tr."+cur_row.attr("title")).addClass("ui-pgrid-table-row-visible").filter("tr.parent.ui-pgrid-table-row-expanded").each(function(){
						// And its descendants, if it's a parent.
						pgrid.show_children($(this));
					});
				});
			};

			pgrid.mark_for_delete_recursively = function(jq_rows) {
				// For each row, mark its children.
				jq_rows.each(function() {
					var cur_row = $(this);
					var cur_title = cur_row.attr("title");
					if (typeof cur_title != "undefined" && cur_title != "") {
						cur_row.siblings("."+cur_title).each(function(){
							// And its descendants, if it's a parent.
							var this_row = $(this);
							if (this_row.hasClass("parent"))
								pgrid.mark_for_delete_recursively(this_row);
							else
								this_row.addClass("ui-pgrid-table-row-marked-for-deletion");
						});
					}
					// Then itself.
					cur_row.addClass("ui-pgrid-table-row-marked-for-deletion");
				});
			};

			pgrid.delete_marked = function() {
				pgrid.children("tbody").children("tr.ui-pgrid-table-row-marked-for-deletion").remove();
				pgrid.do_sort(false, true);
				pgrid.do_filter(false, true);
				pgrid.paginate(true);
				pgrid.update_selected();
			};

			pgrid.paginate = function(loading) {
				if (pgrid.pgrid_paginate) {
					var all_rows = pgrid.children("tbody").children("tr:not(.ui-helper-hidden):not(.child)");
					// Calculate the total number of pages.
					pgrid.pgrid_pages = Math.ceil(all_rows.length / pgrid.pgrid_perpage);

					// If the current page is past the last page, set it to the last page,
					// and if it's before the first page, set it to the first page.
					if (pgrid.pgrid_page + 1 > pgrid.pgrid_pages)
						pgrid.pgrid_page = pgrid.pgrid_pages - 1;
					else if ((pgrid.pgrid_page == -1) && (pgrid.pgrid_pages > 0))
						pgrid.pgrid_page = 0;

					// Hide the previous page's rows.
					if (pgrid.cur_page_rows)
						pgrid.cur_page_rows.removeClass("ui-pgrid-table-row-visible");
					// Select all rows on the current page.
					var page_start = pgrid.pgrid_page * pgrid.pgrid_perpage;
					var page_end = (pgrid.pgrid_page * pgrid.pgrid_perpage) + pgrid.pgrid_perpage;
					pgrid.cur_page_rows = all_rows.slice(page_start, page_end);
					// Unhide them.
					pgrid.cur_page_rows.addClass("ui-pgrid-table-row-visible");
					// And their children.
					pgrid.show_children(pgrid.cur_page_rows);
					// Update the page number and count in the footer.
					if (pgrid.pgrid_footer) {
						if (!pgrid.page_number_elem)
							pgrid.page_number_elem = pgrid.footer.find("input.ui-pgrid-page-number");
						pgrid.page_number_elem.val(pgrid.pgrid_page+1);
						if (!pgrid.page_total_elem)
							pgrid.page_total_elem = pgrid.footer.find("span.ui-pgrid-page-total");
						pgrid.page_total_elem.html(pgrid.pgrid_pages);
					}
				}
				// The grid's state has probably changed.
				if (!loading) pgrid.state_changed();
			};

			pgrid.paginate_queue = function() {
				if (pgrid.paginate_timout)
					window.clearTimeout(pgrid.paginate_timout);
				pgrid.paginate_timout = window.setTimeout(pgrid.paginate, 50);
			};

			pgrid.animate_filter = function(stop) {
				if (stop)
					pgrid.footer_input.stop(true).fadeTo(400, 1);
				else
					pgrid.footer_input.fadeTo(1000, .7).fadeTo(1000, .8, pgrid.animate_filter);
			};

			pgrid.do_filter = function(filter, loading) {
				// Filter if filtering is allowed, or if this is an initial filter.
				if (pgrid.pgrid_filtering || loading) {
					if (pgrid.footer_input) {
						pgrid.footer_input.addClass("ui-state-highlight");
						pgrid.animate_filter();
					}
					if (pgrid.filter_timer)
						window.clearInterval(pgrid.filter_timer);
					if (typeof filter == "string")
						pgrid.pgrid_filter = filter;
					if (pgrid.pgrid_filter.length > 0) {
						var filter_arr = pgrid.pgrid_filter.toLowerCase().split(" ");
						// Find any rows that might match using a simple DOM search.
						var cur_index = 0;
						var rows = pgrid.children("tbody").children();
						pgrid.filter_timer = window.setInterval(function(){
							var cur_row, cur_row_dom, cur_text, i;
							// This loop does 25 rows at a time.
							do {
								cur_row = rows.eq(cur_index);
								if (!cur_row.length) {
									window.clearInterval(pgrid.filter_timer);
									if (pgrid.footer_input) {
										pgrid.footer_input.removeClass("ui-state-highlight");
										pgrid.animate_filter(true);
									}
									break;
								}
								cur_index++;
								cur_row_dom = cur_row.get();
								if (cur_row_dom.pgrid_filter_text) {
									// TODO: Update this when it changes.
									cur_text = cur_row_dom.pgrid_filter_text;
								} else {
									if (cur_row_dom.innerText != undefined)
										cur_text = cur_row_dom.innerText.toLowerCase();
									else if (cur_row_dom.textContent != undefined)
										cur_text = cur_row_dom.textContent.toLowerCase();
									else
										cur_text = cur_row.text().toLowerCase();
									cur_row_dom.pgrid_filter_text = cur_text;
								}
								var match = true;
								for (i in filter_arr) {
									if (cur_text.indexOf(filter_arr[i]) == -1) {
										match = false;
										break;
									}
								}
								if (cur_row.hasClass("ui-helper-hidden")) {
									if (match) cur_row.removeClass("ui-helper-hidden");
								} else {
									if (!match) cur_row.addClass("ui-helper-hidden");
								}
								// Enable the row's ancestors.
								if (match && cur_row.hasClass("child"))
									pgrid.enable_parents(cur_row);
							} while (cur_index % 25);
							if (!loading) {
								// Paginate, since we may have disabled rows.
								pgrid.paginate_queue();
								// Update the selected items, and the record counts.
								pgrid.update_selected_queue();
							}
						}, 1);
					} else {
						// If the user enters nothing, all records should be shown.
						pgrid.children("tbody").children("tr.ui-helper-hidden").removeClass("ui-helper-hidden");
						if (pgrid.footer_input) {
							pgrid.footer_input.removeClass("ui-state-highlight");
							pgrid.animate_filter(true);
						}
						// Only do this if we're not loading, to speed up initialization.
						if (!loading) {
							// Paginate, since we may have disabled rows.
							pgrid.paginate();
							// Update the selected items, and the record counts.
							pgrid.update_selected();
						}
					}
				}
			};

			pgrid.enable_parents = function(jq_rows) {
				// For each row, enable all the row's ancestors.
				jq_rows.filter("tr.child").each(function() {
					var cur_row = $(this);
					// Go through each parent to check if it's the row's parent.
					cur_row.siblings("tr.parent").each(function(){
						var cur_test_row = $(this);
						if (cur_row.hasClass(cur_test_row.attr("title"))) {
							cur_test_row.removeClass("ui-helper-hidden");
							// Enable this row's ancestors too.
							pgrid.enable_parents(cur_test_row);
						}
					});
				});
			};

			pgrid.do_sort = function(column_class, loading) {
				if (pgrid.pgrid_sortable) {
					if (column_class) {
						// If the column class is like "col_1", filter it to an int.
						if (typeof column_class == "string")
							column_class = column_class.replace(/\D/g, "");
						column_class = parseInt(column_class);
					}
					// If they click the header again, change to descending order.
					if (!loading && pgrid.pgrid_sort_col == column_class) {
						if (pgrid.pgrid_sort_ord == "asc")
							pgrid.pgrid_sort_ord = "desc";
						else
							pgrid.pgrid_sort_ord = "asc";
					} else {
						if (column_class) {
							pgrid.pgrid_sort_col = column_class;
							pgrid.pgrid_sort_ord = "asc";
						}
					}

					// Stylize the currently sorted column header. (According to order.)
					var headers = pgrid.children("thead").children().children();
					headers.children("span.ui-pgrid-table-header-sorted-asc, span.ui-pgrid-table-header-sorted-desc")
					.removeClass("ui-pgrid-table-header-sorted-asc")
					.removeClass("ui-pgrid-table-header-sorted-desc")
					.removeClass("ui-icon-triangle-1-s")
					.removeClass("ui-icon-triangle-1-n");
					if (pgrid.pgrid_sort_ord == "asc")
						headers.filter("th.col_"+pgrid.pgrid_sort_col).children("span.ui-icon").addClass("ui-pgrid-table-header-sorted-desc ui-icon-triangle-1-n");
					else
						headers.filter("th.col_"+pgrid.pgrid_sort_col).children("span.ui-icon").addClass("ui-pgrid-table-header-sorted-asc ui-icon-triangle-1-s");

					// Get all the rows.
					var all_rows = pgrid.children("tbody").children();
					all_rows.children("td.ui-pgrid-table-cell-sorted").removeClass("ui-pgrid-table-cell-sorted");
					// Stylize the currently sorted column.
					var cols = all_rows.children("td.col_"+pgrid.pgrid_sort_col).addClass("ui-pgrid-table-cell-sorted");

					// Is this column only numbers, or is there a string?
					var is_str = false;
					// Match only numbers.
					var num_match = new RegExp("^[¤$€£¥#-]?[0-9.,"+pgrid.pgrid_decimal_sep+"]+¢?$");
					// Match only string characters.
					var string_relace = new RegExp("[^0-9"+pgrid.pgrid_decimal_sep+"-]", "g");
					cols.each(function(){
						if (is_str)
							return;
						if (this.innerText != undefined) {
							if (!this.innerText.match(num_match))
								is_str = true;
						} else if (this.textContent != undefined) {
							if (!this.textContent.match(num_match))
								is_str = true;
						} else {
							if (!$(this).text().match(num_match))
								is_str = true;
						}
					});

					var rows = all_rows.get();

					// Calculate their sort keys and store them in their DOM objects.
					$.each(rows, function() {
						var children = this.children[pgrid.pgrid_sort_col];
						if (children.innerText != undefined)
							this.sortKey = children.innerText.toUpperCase();
						else if (children.textContent != undefined)
							this.sortKey = children.textContent.toUpperCase();
						else
							this.sortKey = $(children).text().toUpperCase(); //.replace("├ ", "").replace("└ ", "").toUpperCase();
						if (!is_str) {
							// If this column contains only numbers (currency signs and # included), parse it as floats.
							// Strip non numerical characters except for the decimal separator. Replace that with a period, then parse it.
							this.sortKey = parseFloat(this.sortKey.replace(string_relace, "").replace(pgrid.pgrid_decimal_sep, "."));
						}
					});
					// Sort them by their keys.
					rows.sort(function(a, b) {
						if (a.sortKey < b.sortKey) return -1;
						if (a.sortKey > b.sortKey) return 1;
						return 0;
					});
					// We need to reverse the order if it's descending.
					if (pgrid.pgrid_sort_ord == "desc")
						rows.reverse();
					// Insert the rows into the tbody in the correct order.
					pgrid.children("tbody").append(rows);
					// Place children under their parents.
					all_rows.filter("tr.parent").each(function(){
						var cur_row = $(this);
						cur_row.after(cur_row.siblings("."+cur_row.attr("title")));
					});
					// Paginate, since we changed the order, but only if we're not loading, to speed up initialization.
					if (!loading)
						pgrid.paginate();
				}
			};

			pgrid.update_selected = function() {
				if (pgrid.pgrid_select) {
					// Deselect any disabled rows. They shouldn't be selected.
					pgrid.children("tbody").children("tr.ui-helper-hidden.ui-pgrid-table-row-selected").removeClass("ui-pgrid-table-row-selected").removeClass("ui-state-active");

					// Update the table footer.
					if (pgrid.pgrid_footer && pgrid.pgrid_count)
						pgrid.footer.children("div.ui-pgrid-footer-count-container").find("span.ui-pgrid-footer-count-select").html(pgrid.children("tbody").children("tr.ui-pgrid-table-row-selected").length);
				}
				pgrid.update_count();
			};

			pgrid.update_selected_queue = function() {
				if (pgrid.update_selected_timout)
					window.clearTimeout(pgrid.update_selected_timout);
				pgrid.update_selected_timout = window.setTimeout(pgrid.update_selected, 200);
			};

			pgrid.update_count = function() {
				// Update the table footer.
				if (pgrid.pgrid_footer && pgrid.pgrid_count)
					pgrid.footer.children("div.ui-pgrid-footer-count-container").find("span.ui-pgrid-footer-count-total").html(pgrid.children("tbody").children("tr:not(.ui-helper-hidden)").length);
			};

			pgrid.do_col_hiding = function(loading) {
				var h_rows = pgrid.children("thead").children();
				var b_rows = pgrid.children("tbody").children();
				if (!loading) {
					// First unhide all hidden columns.
					h_rows.children("th:hidden").each(function(){
						var cur_header = $(this).show();
						b_rows.children("td.col_"+cur_header.prevAll().length).show();
					});
				}
				var checkboxes = pgrid.pgrid_header_select.children().children();
				checkboxes.attr("checked", true);
				for (var cur_col in pgrid.pgrid_hidden_cols) {
					if (isNaN(cur_col)) continue;
					checkboxes.filter(".ui-pgrid-table-col-hider-"+pgrid.pgrid_hidden_cols[cur_col]).removeAttr("checked");
					h_rows.children("th.col_"+pgrid.pgrid_hidden_cols[cur_col]).hide();
					b_rows.children("td.col_"+pgrid.pgrid_hidden_cols[cur_col]).hide();
				}
				// The grid's state has probably changed.
				if (!loading) pgrid.state_changed();
			};

			pgrid.hide_col = function(number) {
				if (pgrid.pgrid_hidden_cols.indexOf(number) == -1) {
					pgrid.pgrid_hidden_cols.push(number);
					pgrid.pgrid_header_select.children().children(".ui-pgrid-table-col-hider-"+number).removeAttr("checked");
					pgrid.children("thead").children().children("th.col_"+number).hide();
					pgrid.children("tbody").children().children("td.col_"+number).hide();
					pgrid.state_changed();
				}
			};

			pgrid.show_col = function(number) {
				if (pgrid.pgrid_hidden_cols.indexOf(number) != -1) {
					pgrid.pgrid_hidden_cols.splice(pgrid.pgrid_hidden_cols.indexOf(number), 1);
					pgrid.pgrid_header_select.children().children(".ui-pgrid-table-col-hider-"+number).attr("checked", true);
					pgrid.children("thead").children().children("th.col_"+number).show();
					pgrid.children("tbody").children().children("td.col_"+number).show();
					pgrid.state_changed();
				}
			};

			pgrid.init_rows = function(jq_rows) {
				if (!jq_rows) return;
				// Get table cells ready.
				var new_classes;
				// If this table is resizable, we need its cells to have a width of 1px;
				if (pgrid.pgrid_resize_cols)
					new_classes = "ui-pgrid-table-cell-text ui-pgrid-table-sized-cell";
				else
					new_classes = "ui-pgrid-table-cell-text";
				var col_count = jq_rows.eq(0).children().length;
				var cur_children = jq_rows.children("td:first-child");
				for (var i=1; i<=col_count; i++) {
					cur_children.addClass(new_classes+" col_"+i);
					cur_children = cur_children.next();
				}
				// Add an expander to the rows, add hover events, and give child rows indentation.
				jq_rows.prepend("<td class=\"ui-pgrid-table-expander\"></td>");
				// Add some styling.
				jq_rows.addClass("ui-state-default");
				// Style children.
				pgrid.init_children(jq_rows.filter("tr.parent:not(.child)"));
			};

			pgrid.init_children = function(jq_rows) {
				if (!jq_rows.length) return;
				jq_rows.each(function(){
					// Indent children.
					var cur_row = $(this);
					var cur_padding = parseInt(cur_row.children("td:last-child").css("padding-left"));
					pgrid.init_children(cur_row.siblings("."+cur_row.attr("title")).each(function(){
						$(this).children("td:not(.ui-pgrid-table-expander)").css("padding-left", (cur_padding+10)+"px");
					}).filter("tr.parent"));
				}).children("td.ui-pgrid-table-expander").append($("<span />").addClass("ui-icon ui-icon-triangle-1-e")).click(function(){
					// Bind to expander's click to toggle its children.
					var cur_expander = $(this);
					var cur_working_row = cur_expander.parent();
					if (cur_working_row.hasClass("ui-pgrid-table-row-expanded")) {
						cur_working_row.removeClass("ui-pgrid-table-row-expanded");
						cur_expander.children("span.ui-icon").removeClass("ui-icon-triangle-1-s").addClass("ui-icon-triangle-1-e");
						pgrid.hide_children(cur_working_row);
					} else {
						cur_working_row.addClass("ui-pgrid-table-row-expanded");
						cur_expander.children("span.ui-icon").removeClass("ui-icon-triangle-1-e").addClass("ui-icon-triangle-1-s");
						pgrid.show_children(cur_working_row);
					}
				});
			};

			// Add some coloring when hovering over rows.
			if (pgrid.pgrid_row_hover_effect) {
				// Can't use "hover" because of a bug in Firefox when the mouse moves onto a scrollbar.
				pgrid.children("tbody").delegate("tr", "mouseover", function(){
					$(this).addClass("ui-state-hover");
				}).delegate("tr", "mouseout", function(){
					$(this).removeClass("ui-state-hover");
				});
			}
			// Bind to click for selecting records. Double click for double click action.
			if (pgrid.pgrid_select) {
				pgrid.children("tbody").delegate("tr", "click", function(e){
					if ($(e.target).parent().andSelf().hasClass("ui-pgrid-table-expander")) return;
					var cur_row = $(this);
					if (!pgrid.pgrid_multi_select || (!e.ctrlKey && !e.shiftKey))
						cur_row.siblings().removeClass("ui-pgrid-table-row-selected").removeClass("ui-state-active");
					else if (e.shiftKey)
						cur_row.prevUntil(".ui-pgrid-table-row-selected").addClass("ui-pgrid-table-row-selected ui-state-active");
					if (e.ctrlKey)
						cur_row.toggleClass("ui-pgrid-table-row-selected").toggleClass("ui-state-active");
					else
						cur_row.addClass("ui-pgrid-table-row-selected ui-state-active");
					pgrid.update_selected();
				}).delegate("tr", "dblclick", function(e){
					if ($(e.target).hasClass("ui-pgrid-table-expander")) return;
					$(this).addClass("ui-pgrid-table-row-selected ui-state-active");
					if (pgrid.pgrid_double_click)
						pgrid.pgrid_double_click(e, pgrid.children("tbody").children("tr.ui-pgrid-table-row-selected"));
					if (pgrid.pgrid_double_click_tb)
						pgrid.pgrid_double_click_tb();
				}).delegate("tr", "mousedown", function(e){
					// Prevent the browser from selecting text if the user is holding a modifier key.
					return !(e.ctrlKey || e.shiftKey);
				});
			}

			// Select the thead rows.
			var h_rows = pgrid.children("thead").children();

			// Iterate column headers and make a checkbox to hide each one.
			h_rows.children().each(function(index){
				var cur_header = $(this);
				pgrid.pgrid_header_select.append($("<label></label>")
					.addClass("ui-state-default ui-corner-all")
					.append($("<input type=\"checkbox\" />").change(function(e){
						if (e.target.checked)
							pgrid.show_col(index+1);
						else
							pgrid.hide_col(index+1);
					}).addClass("ui-pgrid-table-col-hider-"+(index+1)))
					.append(cur_header.text()));
			});
			// Add the header_select class;
			pgrid.pgrid_header_select.addClass("ui-pgrid-header-select ui-widget-header ui-corner-all");
			// Add a handler to hide the header selector.
			pgrid.pgrid_header_select.mouseenter(function(){
				$(this).mouseleave(function(){
					$(this).fadeOut("fast").unbind("mouseleave");
				});
			});

			// Resizing variables.
			pgrid.resizing_header = false;
			pgrid.resizing_tempX = 0;
			// Wrap header text in a div.
			var cur_text = $("<div />").addClass("ui-pgrid-table-header-text");
			// Add a "sortable" class for custom styling.
			if (pgrid.pgrid_sortable) cur_text.addClass("ui-pgrid-table-header-sortable");
			var h_headers = h_rows.children("th:not(.ui-pgrid-table-expander)")
			.mouseup(function(){
				// Bind to mouseup (not click) on the header to sort it.
				// If we bind to click, resizing_header will always be false.
				// If we're resizing, don't sort it.
				if (pgrid.resizing_header)
					pgrid.resizing_header = false;
				else
					pgrid.do_sort($(this).prevAll().length);
			})
			.wrapInner(cur_text)
			.append($("<span />").addClass("ui-icon"));
			// Provide column resizing, if set. The header's text div will actually size the entire column.
			if (pgrid.pgrid_resize_cols) {
				// Add a "resizeable" class for custom styling.
				h_headers.addClass("ui-pgrid-table-header-resizeable").mousedown(function(e){
					var cur_header = $(this);
					var relx = e.pageX - cur_header.offset().left;
					// Only start resizing if the user grabs the edge of the box. (And don't resize the expander column.)
					if ((relx < 4 && cur_header.hasClass("ui-pgrid-table-expander")) || (relx > 3 && relx < cur_header.width() - 4))
						return true;
					pgrid.resizing_header = true;
					pgrid.resizing_tempX = e.pageX;
					// If the user selected the left edge of this box, they want to resize the previous box.
					if (relx < 4)
						pgrid.resizing_cur = cur_header.prev().children("div.ui-pgrid-table-header-text");
					else
						pgrid.resizing_cur = cur_header.children("div.ui-pgrid-table-header-text");
					// Prevent the browser from selecting text while the user is resizing a header.
					return false;
				});
			}
			h_headers.each(function(index){
				// Add the column class to the cell.
				$(this).addClass("col_"+(index+1));
			});
			delete h_headers;
			// When the mouse moves over the pgrid, and a column is being resized, set its width.
			if (pgrid.pgrid_resize_cols) {
				pgrid.pgrid_widget.mousemove(function(e){
					if (pgrid.resizing_header) {
						var cur_width = pgrid.resizing_cur.width();
						var new_width = cur_width + e.pageX - pgrid.resizing_tempX;
						if (new_width > 0) {
							pgrid.resizing_tempX = e.pageX;
							pgrid.resizing_cur.width(new_width);
						}
					}
				}).mouseup(function(){
					pgrid.resizing_header = false;
				});
			}

			// Add an expander column to the header.
			h_rows.addClass("ui-widget-header").prepend($("<th class=\"ui-icon ui-pgrid-table-icon-hidden ui-pgrid-table-expander\"><div style=\"width: 16px; visibility: hidden;\">+</div></th>").click(function(e){
				// Show the header selector.
				var offset = pgrid.pgrid_widget.offset();
				pgrid.pgrid_header_select.css({
					left: (e.pageX - offset.left - 5),
					top: (e.pageY - offset.top - 5)
				});
				pgrid.pgrid_header_select.fadeIn("fast");
			}).mouseover(function(){
				$(this).removeClass("ui-pgrid-table-icon-hidden").addClass("ui-icon-triangle-1-s");
			}).mouseout(function(){
				$(this).addClass("ui-pgrid-table-icon-hidden").removeClass("ui-icon-triangle-1-s");
			}));

			delete h_rows;

			// Initialize the rows.
			pgrid.init_rows(pgrid.children("tbody").children());

			// Now that the column classes have been assigned and hiding/showing is done,
			// we can hide the default hidden columns.
			pgrid.do_col_hiding(true);

			// Wrap the table and its container in a viewport, so we can size it.
			pgrid.pgrid_table_viewport = $("<div class=\"ui-pgrid-table-viewport ui-widget-content\" />");
			pgrid.pgrid_table_container.appendTo(pgrid.pgrid_table_viewport);
			// Reset the object. (Not needed anymore.)
			//pgrid.pgrid_table_viewport = pgrid.pgrid_table_container.parent();
			pgrid.pgrid_table_viewport.height(pgrid.pgrid_view_height);
			if (pgrid.pgrid_view_height != "auto") {
				pgrid.pgrid_table_container.css({
					position: "absolute",
					top: "0",
					bottom: "0",
					left: "0",
					right: "0"
				});
			}

			/* -- Toolbar -- */
			if (pgrid.pgrid_toolbar) {
				pgrid.toolbar = $("<div />").addClass("ui-pgrid-toolbar ui-helper-clearfix");

				$.each(pgrid.pgrid_toolbar_contents, function(key, val){
					if (val.type == "button") {
						var cur_button = $("<div />").addClass("ui-pgrid-toolbar-button ui-state-default ui-corner-all").append(
							$((typeof val.text == "undefined" || val.text == "") ? "<div><div class=\"ui-pgrid-toolbar-blank\">-</div></div>" : "<div>"+val.text+"</div>").each(function(){
								if (val.extra_class)
									$(this).addClass(val.extra_class);
							})
						).mouseup(function(e){
							if (e.button == 2)
								return true;
							var selected_rows = (val.return_all_rows ? pgrid.children("tbody").children("tr:not(.ui-helper-hidden)") : pgrid.children("tbody").children("tr.ui-pgrid-table-row-selected"));
							if (!val.selection_optional && !val.select_all && !val.select_none && selected_rows.length === 0) {
								alert("Please make a selection before performing this operation.");
								return false;
							}
							if (!val.multi_select && !val.selection_optional && !val.select_all && !val.select_none && selected_rows.length > 1) {
								alert("Please choose only one item before performing this operation.");
								return false;
							}
							if (val.confirm) {
								if (val.return_all_rows) {
									if (!confirm("Are you sure you want to perform the operation \""+val.text+"\" on all items?"))
										return false;
								} else if (selected_rows.length === 0) {
									if (!confirm("Are you sure you want to perform the operation \""+val.text+"\"?"))
										return false;
								} else {
									if (!confirm("Are you sure you want to perform the operation \""+val.text+"\" on the "+selected_rows.length+" currently selected item(s)?"))
										return false;
								}
							}
							if (val.select_all) {
								if (pgrid.pgrid_select && pgrid.pgrid_multi_select) {
									pgrid.children("tbody").children("tr:not(.ui-helper-hidden)").addClass("ui-pgrid-table-row-selected ui-state-active");
									pgrid.update_selected();
								}
							}
							if (val.select_none) {
								if (pgrid.pgrid_select) {
									pgrid.children("tbody").children().removeClass("ui-pgrid-table-row-selected").removeClass("ui-state-active");
									pgrid.update_selected();
								}
							}
							if (val.click) {
								var row_data = "";
								if (val.pass_csv || val.pass_csv_with_headers) {
									// Pass a CSV of the selected rows, instead of a jQuery object.
									if (val.pass_csv_with_headers)
										selected_rows = pgrid.children("thead").children().add(selected_rows);
									selected_rows.each(function() {
										// Turn each cell into a CSV cell.
										$(this).children("th:not(.ui-pgrid-table-expander), td:not(.ui-pgrid-table-expander)").each(function(){
											var cur_cell = $(this);
											row_data += "\""+cur_cell.contents().text().replace("\"", "\"\"")+"\"";
											// Add a comma, if there is another cell.
											if (cur_cell.next())
												row_data += ",";
										});
										// Add a new line after each row.
										row_data += "\n";
									});
								} else {
									// Pass a jQuery object of the selected rows.
									row_data = selected_rows;
								}
								return val.click(e, row_data);
							} else if (val.url) {
								var parsed_url = val.url;
								var cur_title = "";
								var cur_cols_text = [];
								selected_rows.each(function(){
									var cur_row = $(this);
									var cur_cells = cur_row.children("td:not(.ui-pgrid-table-expander)");
									cur_title += (cur_title.length ? val.delimiter : "") + pgrid_encode_uri(cur_row.attr("title"));
									cur_cells.each(function(i){
										if (!cur_cols_text[i+1])
											cur_cols_text[i+1] = pgrid_encode_uri($(this).contents().text());
										else
											cur_cols_text[i+1] += val.delimiter + pgrid_encode_uri($(this).contents().text());
									});
								});
								parsed_url = parsed_url.replace("__title__", cur_title);
								for (var i in cur_cols_text) {
									if (isNaN(i)) continue;
									parsed_url = parsed_url.replace("__col_"+i+"__", cur_cols_text[i]);
								}
								if (e.button == 1 || (val.target && val.target != "_self")) {
									if (val.window_features)
										return window.open(parsed_url, val.target, val.window_features);
									return window.open(parsed_url, val.target);
								} else {
									// If Pines is loaded, use its get method instead of setting location.
									if (typeof pines != "undefined" && pines.get)
										return pines.get(parsed_url);
									return (window.location = parsed_url);
								}
							}
							return true;
						}).mousedown(function(){
							// Prevent text selection;
							return false;
						}).hover(function(){
							$(this).addClass("ui-state-hover");
						}, function(){
							$(this).removeClass("ui-state-hover");
						});
						if (typeof val.title != "undefined")
							cur_button.attr("title", val.title);
						if (val.double_click) {
							// Save any previous double click functions.
							if (pgrid.pgrid_double_click_tb)
								var _old_double_click_tb = pgrid.pgrid_double_click_tb;
							pgrid.pgrid_double_click_tb = function() {
								// Call any previous double click functions.
								if (_old_double_click_tb)
									_old_double_click_tb();
								cur_button.mouseup();
							};
						}
						pgrid.toolbar.append(cur_button);
					} else if (val.type == "text") {
						var wrapper = $("<div />").addClass("ui-pgrid-toolbar-text");
						if (val.extra_class)
							wrapper.addClass(val.extra_class);
						if (typeof val.title != "undefined")
							wrapper.attr("title", val.title);
						if (val.label)
							wrapper.append($("<span>"+val.label+"</span>").addClass("ui-pgrid-toolbar-text-label"));
						var cur_text = $("<input type=\"text\" />").addClass("ui-widget ui-widget-content ui-corner-all");
						if (!val.dont_prevent_default) {
							cur_text.keydown(function(e){
								if (e.keyCode == 13)
									e.preventDefault();
							});
						}
						if (val.attributes)
							cur_text.attr(val.attributes);
						wrapper.append(cur_text);
						pgrid.toolbar.append(wrapper);
						if (val.load)
							val.load(cur_text);
					} else if (val.type == "separator") {
						pgrid.toolbar.append(
							$("<div />").addClass("ui-pgrid-toolbar-sep ui-state-default").append(
								$("<div>-</div>").addClass("ui-pgrid-toolbar-blank")
							)
						);
					}
				});

			}

			/* -- Footer -- */
			// Build a footer to place some utilities.
			if (pgrid.pgrid_footer) {
				pgrid.footer = $("<div />").addClass("ui-pgrid-footer ui-widget-header ui-corner-bottom ui-helper-clearfix").delegate("button", "mouseenter", function(){
					$(this).addClass("ui-state-hover");
				}).delegate("button", "mouseleave", function(){
					$(this).removeClass("ui-state-hover");
				});

				// Provide filtering controls.
				if (pgrid.pgrid_filtering) {
					// Add filtering controls to the grid's footer.
					pgrid.footer.append(
						$("<div />").addClass("ui-pgrid-footer-filter-container").each(function(){
							$(this).append($("<span>Filter: </span>").append(
								$("<input />").addClass("ui-pgrid-footer-filter-input ui-widget ui-widget-content ui-corner-all").attr({
									type: "text",
									value: pgrid.pgrid_filter,
									size: "10"
								}).keyup(function(){
									pgrid.do_filter($(this).val());
								})
							).append(
								$("<button type=\"button\">X</button>").addClass("ui-state-default ui-corner-all").click(function(){
									$(this).prev("input").val("").keyup().focus();
								})
							));
						})
					);
					pgrid.footer_input = pgrid.footer.find("input.ui-pgrid-footer-filter-input");
				}
			}
			// Filter the grid.
			if (pgrid.pgrid_filter != "")
				pgrid.do_filter(pgrid.pgrid_filter, true);

			// Sort the grid.
			if (pgrid.pgrid_sort_col) {
				// If the sort column is like "col_1", filter it to an int.
				if (typeof pgrid.pgrid_sort_col == "string")
					pgrid.pgrid_sort_col = pgrid.pgrid_sort_col.replace(/\D/g, "");
				pgrid.pgrid_sort_col = parseInt(pgrid.pgrid_sort_col);
				// Since the order is switched if the column is already set, we need to set the order to the opposite.
				// This also works as a validator. Anything other than "desc" will become "asc" when it's switched.
				if (pgrid.pgrid_sort_ord == "desc")
					pgrid.pgrid_sort_ord = "asc";
				else
					pgrid.pgrid_sort_ord = "desc";
				// Store the real sortable value in a temp val, and make sure it's true while we sort initially.
				var tmp_col_val = pgrid.pgrid_sortable;
				pgrid.pgrid_sortable = true;
				pgrid.do_sort(pgrid.pgrid_sort_col, true);
				// Restore the original sortable value. That way, you can decide to sort by a column, but not allow the user to change it.
				pgrid.pgrid_sortable = tmp_col_val;
			}

			// Paginate the grid.
			if (pgrid.pgrid_paginate) {
				// Add the paginated class.
				pgrid.addClass("ui-pgrid-paginated");
				// Add pagination controls to the grid's footer.
				if (pgrid.pgrid_footer) {
					pgrid.footer.append(
						$("<div />").addClass("ui-pgrid-footer-pager-container").each(function(){
							var footer_pager = $(this);
							footer_pager.append("Display ")
							.append(
								$("<input />").addClass("ui-widget ui-widget-content ui-corner-all").attr({
									type: "text",
									value: pgrid.pgrid_perpage,
									size: "1"
								}).change(function(){
									var display_number = $(this);
									pgrid.set_per_page(Math.abs(parseInt(display_number.val())));
									display_number.val(pgrid.pgrid_perpage);
								})
							)
							.append(" ")
							.append($("<button type=\"button\">&lt;&lt; Start</button>").addClass("ui-state-default ui-corner-all").click(function(){
								pgrid.pagestart();
							}))
							.append($("<button type=\"button\">&lt; Prev</button>").addClass("ui-state-default ui-corner-all").click(function(){
								pgrid.pageprev();
							}))
							.append(" Page ")
							.append(
								$("<input />").addClass("ui-widget ui-widget-content ui-corner-all ui-pgrid-page-number").attr({
									type: "text",
									value: pgrid.pgrid_page,
									size: "3"
								}).change(function(){
									pgrid.pagenum(Math.abs(parseInt($(this).val())) - 1);
								})
							)
							.append(" of <span class=\"ui-pgrid-page-total\">1</span> ")
							.append($("<button type=\"button\">Next &gt;</button>").addClass("ui-state-default ui-corner-all").click(function(){
								pgrid.pagenext();
							}))
							.append($("<button type=\"button\">End &gt;&gt;</button>").addClass("ui-state-default ui-corner-all").click(function(){
								pgrid.pageend();
							}));
						})
					);
				}
				// Perform the pagination and update the controls' text.
				pgrid.paginate(true);
			}

			// Make selected and total record counters.
			if (pgrid.pgrid_footer) {
				if (pgrid.pgrid_count) {
					// Make a counter.
					pgrid.footer.append(
						$("<div />").addClass("ui-pgrid-footer-count-container").each(function(){
							var footer_counter = $(this);
							if (pgrid.pgrid_select)
								footer_counter.append($("<span><span class=\"ui-pgrid-footer-count-select\">0</span> selected of </span>"));
							footer_counter.append($("<span><span class=\"ui-pgrid-footer-count-total\">0</span> rows</span>"));
						})
					);
					// Update the selected and total count.
					pgrid.update_selected();
				}
			}

			// Make a table sizer.
			if (pgrid.pgrid_footer) {
				if (pgrid.pgrid_resize) {
					var orig_y;
					var orig_height;
					var resize_table_function = function(e){
						orig_height += e.pageY - orig_y;
						orig_y = e.pageY;
						pgrid.pgrid_table_viewport.css("height", orig_height+"px");
						return false;
					};
					// Make a resize handle.
					pgrid.footer.append(
						$("<div />").addClass("ui-pgrid-footer-resize-container")
						.append($("<span class=\"ui-icon ui-icon-grip-solid-horizontal\"></span>"))
						.mousedown(function(e){
							orig_y = e.pageY;
							orig_height = pgrid.pgrid_table_viewport.height();
							$("body").delegate("*", "mousemove", resize_table_function);
						}).mouseup(function(e){
							$("body").undelegate("*", "mousemove", resize_table_function);
							pgrid.state_changed();
						})
					);
				}
			}

			// Put the toolbar into the DOM.
			if (pgrid.pgrid_toolbar)
				pgrid.pgrid_widget.append($("<div />").addClass("ui-pgrid-toolbar-container ui-widget-header ui-corner-top").append(pgrid.toolbar));
			// Put the grid back into the DOM.
			pgrid.pgrid_widget.append(pgrid.pgrid_table_viewport);
			// Put the footer into the DOM.
			if (pgrid.pgrid_footer)
				pgrid.pgrid_widget.append(pgrid.footer);
			// Put the header selector into the DOM.
			pgrid.pgrid_widget.append(pgrid.pgrid_header_select);

			// Save the pgrid object in the DOM, so we can access it.
			this.pines_grid = pgrid;
		});

		return this;
	};

	var pgrid_encode_uri = function(text){
		if (encodeURIComponent)
			return encodeURIComponent(text);
		else
			return escape(text);
	};

	$.fn.pgrid.defaults = {
		// Show a toolbar.
		pgrid_toolbar: false,
		// Contents of the toolbar.
		pgrid_toolbar_contents: [],
		// Show a footer.
		pgrid_footer: true,
		// Include a record count in the footer.
		pgrid_count: true,
		// Allow selecting records.
		pgrid_select: true,
		// Allow selecting multiple records.
		pgrid_multi_select: true,
		// Double click action.
		pgrid_double_click: null,
		// Paginate the grid.
		pgrid_paginate: true,
		// Opening page.
		pgrid_page: 0,
		// Top-level entries per page.
		pgrid_perpage: 15,
		// Allow filtering.
		pgrid_filtering: true,
		// Default filter.
		pgrid_filter: "",
		// Hidden columns. (Columns start at one.)
		pgrid_hidden_cols: [],
		// Allow columns to be resized.
		pgrid_resize_cols: true,
		// Allow records to be sorted.
		pgrid_sortable: true,
		// The default sorted column. (false, or column number)
		pgrid_sort_col: 1,
		// The default sort order. ("asc" or "desc")
		pgrid_sort_ord: "asc",
		// Decimal seperator. (Used during sorting of numbers.)
		pgrid_decimal_sep: ".",
		// Add a hover effect to the rows.
		pgrid_row_hover_effect: true,
		// Height of the box (viewport) containing the grid. (Not including the toolbar and footer.)
		pgrid_view_height: "420px",
		// Allow the table to be resized. (Only height.)
		pgrid_resize: true,
		// State change. Gets called whenever the user changes the state of the grid. The state from export_state() will be passed.
		pgrid_state_change: null
	};
})(jQuery);