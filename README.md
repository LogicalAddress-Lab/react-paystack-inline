# react-paystack-inline

## Installation

Get started by installing with npm

`npm install react-paystack-inline`

## How to

### With Custom Button

```
<form className="plan" onSubmit={this.processForm} id="pay">
   
    <div className="row">
        <PaystackInline amount={this.state.amount} description={this.state.description} email={user.email} callback={this.onToken} paystackKey={paystackKey}>
            <button className="button">Pay</button>
        </PaystackInline>
    </div>
</form>
```

### With Paystack default button

```
<form className="plan" onSubmit={this.processForm} id="pay">
   
    <div className="row">
        <PaystackInline formId="pay" lazy={true} amount={this.state.amount} description={this.state.description} email={user.email} callback={this.onToken} paystackKey={paystackKey}/>
    </div>
</form>
```