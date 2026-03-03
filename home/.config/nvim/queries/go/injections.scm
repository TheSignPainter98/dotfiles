; Embedded starlark
(call_expression
	function: (selector_expression
		operand: (identifier) @_id (#eq? @_id "st")
		field: (field_identifier) @_field (#eq? @_field "RunString")
	)
	arguments: (argument_list
		(raw_string_literal) @python ; (#offset! @python 1 0 -1 0)
	)
)
(call_expression
	function: (selector_expression
		operand: (identifier) @_id (#eq? @_id "st")
		field: (field_identifier) @_field (#eq? @_field "SetExecutionStepModel")
	)
	arguments: (argument_list
		(raw_string_literal) @python ; (#offset! @python 1 0 -1 0)
	)
)
