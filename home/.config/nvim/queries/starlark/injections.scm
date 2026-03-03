(expression_statement
  (call
	function: (attribute
	  object: (identifier) @_obj (#eq? @_obj "vex")
	  attribute: (identifier) @_attr (#eq? @_attr "search")
	)
	arguments: (argument_list
	  .
	  (string)
	  .
	  (string) @scheme (#offset! @scheme 0 0 0 0)
	)
  )
)
