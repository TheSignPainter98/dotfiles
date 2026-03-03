; Embedded lua
(call_expression
  function: (field_expression
    field: (field_identifier) @_field (#eq? @_field "load")
  )
  arguments: (arguments
    (macro_invocation
	  macro: (identifier) @_macro (#eq? @_macro "chunk")
	  (token_tree) @lua (#offset! @lua 1 0 -1 0)
    )
  )
)

; Embedded sql
(call_expression
  function: (scoped_identifier
	path: (identifier) @_pkg (#eq? @_pkg "sqlx")
	name: (identifier) @_func (#eq? @_func "query"))
  arguments: (arguments
	(string_literal) @sql (#offset! @sql 1 0 -1 0)))
(call_expression
  function: (scoped_identifier
	path: (identifier) @_pkg (#eq? @_pkg "sqlx")
	name: (identifier) @_func (#eq? @_func "query"))
  arguments: (arguments
	(raw_string_literal) @sql (#offset! @sql 3 0 -2 0)))
