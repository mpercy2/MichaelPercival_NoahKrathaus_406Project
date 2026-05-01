// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Vault {
    IERC20 public immutable token;
    

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    //made these public so ppl can see it/ frontend can see it when that gets made
    address public admin; //administrator
    uint256 public feePercent;

    // Governance Membership data structures

    uint256 private _membershipTokenId;
    mapping(uint256 => address) public _ownerOfmembershipToken;
    mapping(address => uint256) public _balanceOfmembershipToken;
    mapping(address => uint256) public _membershipTokenOf;

    function _mintMembership(address to) internal {
        //mint membership token if not already owned 
        if (_balanceOfmembershipToken[to] == 0) {
            _membershipTokenId += 1; 
            _ownerOfmembershipToken[_membershipTokenId] = to;
            _balanceOfmembershipToken[to] = 1;
            _membershipTokenOf[to] = _membershipTokenId;
        }
    }


    constructor(address _token) {
        token = IERC20(_token); // we put the contract to tempo token here once deployed to link it
        admin = msg.sender; // deployer becomes admin
        feePercent = 100; // 1 percent fee in terms of basis points
    }

    function _mint(address _to, uint256 _shares) private {
        totalSupply += _shares;
        balanceOf[_to] += _shares;

        //also minting a membership
        _mintMembership(_to);
    
    }

    function _burn(address _from, uint256 _shares) private {
        totalSupply -= _shares;
        balanceOf[_from] -= _shares;
    }

    function deposit(uint256 _amount) external {
        /*
        a = amount (collateral)
        B = balance of token before deposit (total assets)
        T = total supply (total supply of vault tokens)
        s = shares to mint (new token to mint)

        (T + s) / T = (a + B) / B 

        s = aT / B
        */
        uint256 shares;
        if (totalSupply == 0) {
            shares = _amount;
        } else {
            shares = (_amount * totalSupply) / token.balanceOf(address(this));
        }

        _mint(msg.sender, shares);
        token.transferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(uint256 _shares) external {
        /*
        a = amount
        B = balance of token before withdraw
        T = total supply
        s = shares to burn

        (T - s) / T = (B - a) / B 

        a = sB / T
        */
        uint256 grossAmount =
            (_shares * token.balanceOf(address(this))) / totalSupply;
        _burn(msg.sender, _shares);

        // Take a fee for using the vault
        uint256 fee = (grossAmount * feePercent) / 10000; //10000 gets out of basis points, as the feePercent is set up as such
        uint256 amount = grossAmount - fee;
        
        token.transfer(msg.sender, amount);
        token.transfer(admin, fee); //send fee to admin
        //
        
        token.transfer(msg.sender, amount);
        token.transfer(admin, fee);

        // you can implement revoking of governance membership here
       if (balanceOf[msg.sender] == 0 && _balanceOfmembershipToken[msg.sender] == 1) { //no bal but is a member
            uint256 tokenId = _membershipTokenOf[msg.sender];
            delete _ownerOfmembershipToken[tokenId];
            _balanceOfmembershipToken[msg.sender] = 0;
            delete _membershipTokenOf[msg.sender]; //revoke membership
        }
        //
    }
    
}

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount)
        external
        returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(
        address indexed owner, address indexed spender, uint256 amount
    );
}