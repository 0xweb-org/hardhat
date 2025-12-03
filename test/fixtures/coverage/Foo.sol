contract Foo {
    string public name;
    event Updated (string newName);

    constructor(string memory _name) {
        name = _name;
    }

    function setName(string memory _name) public {
        name = _name;
        emit Updated(name);
    }

    function getName () public view returns (string memory) {
        if (block.number % 11 == 0) {
            return "GetName Overriden Eq";
        }
        return name;
    }
}
