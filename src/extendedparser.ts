import Parser, { Query } from 'tree-sitter'; // 引入Tree-sitter的Query类

export class ExtendedParser extends Parser {  
  
  constructor() {
    super();
  }

  createQuery(userInput: string): Query {
    
    const tree = this.parse(userInput);
    let tc = tree.walk()
    const query = new Query(
      this.getLanguage(), 
      tc.nodeText
    );

    return query;
  }

}