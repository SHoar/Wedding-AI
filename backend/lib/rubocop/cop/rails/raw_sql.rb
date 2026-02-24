# frozen_string_literal: true

module RuboCop
  module Cop
    module Rails
      # Forbids raw SQL in application code. Use Active Record query interface
      # (scopes, where with hash, etc.) instead of execute, find_by_sql, or
      # where with a string to avoid SQL injection and keep queries testable.
      #
      # @example
      #   # bad
      #   connection.execute("SELECT ...")
      #   Model.find_by_sql("SELECT ...")
      #   Model.where("name = '#{name}'")
      #
      #   # good
      #   Model.where(name: name)
      #   Model.order(:created_at)
      class RawSql < Base
        MSG = "Avoid raw SQL. Use Active Record query interface (scopes, where with hash) instead of %<method>s."

        RESTRICT_ON_SEND = %i[execute find_by_sql where].freeze

        def on_send(node)
          if node.method?(:find_by_sql)
            add_offense(node, message: format(MSG, method: "find_by_sql"))
            return
          end

          if node.method?(:execute)
            add_offense(node, message: format(MSG, method: "execute"))
            return
          end

          check_where_with_string(node) if node.method?(:where)
        end

        private

        def check_where_with_string(node)
          return unless node.method?(:where)
          return unless node.arguments.any? { |arg| string_argument?(arg) }

          add_offense(node, message: format(MSG, method: "where with raw SQL string"))
        end

        def string_argument?(node)
          return false unless node

          case node.type
          when :str, :dstr
            true
          when :send
            # Arel or other method call that might build SQL
            node.method_name == :sanitize_sql_array ? false : false
          else
            false
          end
        end
      end
    end
  end
end
