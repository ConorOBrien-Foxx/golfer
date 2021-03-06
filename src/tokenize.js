let tokenize = function(code) {
  class Token {
    constructor(type, value, start, end, line) {
      this.type = type;
      this.value = value;
      this.start = start;
      this.end = end;
      this.line = line;
    }
  }

  let orig = code,
      tokens = [],
      startIndex = 0,
      endIndex = 0,
      maxloop = 10000,
      braces = [0],
      expression = false,
      line = 1;
  while (code.length && maxloop--) {
    let stripped, strip = (regex) => {
      if (code.search(regex) === 0) {
        [stripped] = code.match(regex) || [];
        code = code.slice(stripped.length);
        startIndex = endIndex;
        endIndex += stripped.length;
        return stripped;
      } else {
        return false;
      }
    };
    let addToken = (type) => {
      tokens.push(new Token(type, stripped, startIndex, endIndex, line));
    }

    if (strip(/ |\t/)) {
      addToken("whitespace");
    }
    else if (strip(/\r?\n|\r/)) {
      addToken("line-end");
      line++;
    }

    // Numeric literals: binary, octal, hex, decimal
    else if (strip(/0b[01]+/)) {
      addToken("literal");
      expression = true;
    }
    else if (strip(/0o[0-7]+/)) {
      addToken("literal");
      expression = true;
    }
    else if (strip(/0x[0-9A-Fa-f]+/)) {
      addToken("literal");
      expression = true;
    }
    else if (strip(/\d+\.?\d*(?:e[+-]?\d+)?/i)) {
      addToken("literal");
      expression = true;
    }
    else if (strip(/\.\d+(?:e[+-]?\d+)?/)) {
      addToken("literal");
      expression = true;
    }

    // String literals
    else if (strip(/(["'])(?:(?!\1)(?:\\[^]|[^\\]))*\1/)) {
      addToken("literal");
      expression = true;
      if(stripped.indexOf("\n") !== -1)
          line++;
    }

    // Template literals
    else if (strip(/`(?:\\[^]|(?!\$\{)[^\\`])*`/)) {
      addToken("template");
      expression = true;
      if(stripped.indexOf("\n") !== -1)
          line++;
    }
    else if (strip(/`(?:\\[^]|(?!\$\{)[^\\`])*\$\{/)) {
      addToken("template-start");
      braces.unshift(0);
      expression = false;
      if(stripped.indexOf("\n") !== -1)
          line++;
    }
    else if (braces[0] === 0 && braces.length > 1 && strip(/\}(?:\\[^]|(?!\$\{)[^\\`])*`/)) {
      addToken("template-end");
      expression = true;
      braces.shift();
      if(stripped.indexOf("\n") !== -1)
          line++;
    }
    else if (braces[0] === 0 && braces.length > 1 && strip(/\}(?:\\[^]|(?!\$\{)[^\\`])*\$\{/)) {
      addToken("template-middle");
      expression = false;
      if(stripped.indexOf("\n") !== -1)
          line++;
    }

    // Values that throw an error when you try to assign something to
    // undefined, Infinity, and NaN cannot be assigned to, but they don't throw an error either
    else if (strip(/(?:false|true|null|this)(?![\w$])/)) {
      addToken("literal");
      expression = false;
    }

    // Taken from http://www.javascripter.net/faq/reserved.htm, but
    // only the ones that cannot be used as variable names in Firefox 54.0a2
    else if (strip(/(?:break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|return|switch|throw|try|typeof|var|void|while|with)(?![\w$])/)) {
      addToken("keyword");
      expression = false;
    }

    // Valid identifier names (excluding Unicode)
    else if (strip(/[A-Za-z_$][\w$]*/)) {
      addToken("identifier");
      expression = true;
    }

    // Comments
    else if (strip(/\/\/.*/)) {
      addToken("comment");
    }
    else if (strip(/\/\*(?:(?!\*\/).)*\*\//)) {
      addToken("comment");
    }

    // Regexes
    else if (!expression && strip(/\/(?:\\.|\[(?:\\.|[^\]\n\r])+\]|[^\\\/\n\r])+\/[A-Za-z]*/)) {
      addToken("literal");
      expression = true;
    }

    // Operators
    else if (strip(/!|~|\?|:|=>|\.\.\.|\.|&&|\|\||\+\+|--|(?:\*\*|!=|==|<<|>>>?|[+\-*\/%&|^<=>])=?/)) {
      addToken("operator");
      expression = false;
    }

    // Various other structural components
    else if (strip(/,/)) {
      addToken("comma");
      expression = false;
    }
    else if (strip(/;/)) {
      addToken("semicolon");
      expression = false;
    }
    else if (strip(/\(/)) {
      addToken("left-paren");
      expression = false;
    }
    else if (strip(/\)/)) {
      addToken("right-paren");
      expression = true;
    }
    else if (strip(/\[/)) {
      addToken("left-bracket");
      expression = false;
    }
    else if (strip(/\]/)) {
      addToken("right-bracket");
      expression = true;
    }
    else if (strip(/\{/)) {
      braces[0]++;
      addToken("left-brace");
      expression = false;
    }
    else if (strip(/\}/)) {
      if (braces[0] > 0) {
        braces[0]--;
        addToken("right-brace");
        expression = true;
      } else {
        throw new SyntaxError("Unmatched right-brace at index " + startIndex);
      }
    }
    else {
      throw new SyntaxError("Couldn't understand this code: " + code);
    }
  }

  console.log(tokens);
  return tokens;
}

if (typeof window === "undefined") module.exports = tokenize;
