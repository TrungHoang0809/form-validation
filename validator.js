function Validator(formSelector, options = {}) {
    function getParentElement(element, selector) {

        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }

    }

    var formRules = {};

    var validatorRules = {
        required: function (value) {
            return value ? undefined : "Required!";
        },
        email: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : "Email is not valid!";
        },
        min: function (min) {
            return function (value) {
                return value.length >= min ? undefined : `At least ${min} characters!`
            }
        },
        max: function (max) {
            return function (value) {
                return value.length <= max ? undefined : `Up to ${max} characters!`;
            }
        }
    }

    var formElement = document.querySelector(formSelector);

    if (formElement) {
        var inputs = formElement.querySelectorAll("[name][rules]");

        for (var input of inputs) {
            var rules = input.getAttribute("rules").split("|");
            for (var rule of rules) {
                var ruleHasValue = rule.includes(":");
                var ruleInfo;

                if (ruleHasValue) {
                    ruleInfo = rule.split(":");
                    rule = ruleInfo[0];
                }

                var ruleFunc = validatorRules[rule];

                if (ruleHasValue) {
                    ruleFunc = validatorRules[rule](ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                }
                else {
                    formRules[input.name] = [ruleFunc];
                }
            }
            //listen event of input to validate:
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        function handleValidate(event) {
            var rules = formRules[event.target.name];
            var errorMessage;

            rules.some(function (rule) {
                errorMessage = rule(event.target.value);
                return errorMessage;
            });

            if (errorMessage) {
                var formGroup = getParentElement(event.target, ".form-group");
                if (!formGroup) return;

                formGroup.classList.add("invalid");
                var formError = formGroup.querySelector(".form-message");
                if (formError) {
                    formError.innerText = errorMessage;
                }

            }
            return !errorMessage;
        }

        function handleClearError(event) {
            var formGroup = getParentElement(event.target, ".form-group");
            if (formGroup.classList.contains("invalid")) {
                formGroup.classList.remove('invalid');
            }

            var formError = formGroup.querySelector(".form-message");
            formError.innerText = "";
        }
    }

    formElement.onsubmit = function (event) {
        event.preventDefault();

        var inputs = formElement.querySelectorAll("[name][rules]");
        for (var input of inputs) {
            var isValid = true;
            if (!handleValidate({ target: input })) {
                isValid = false;
            }
        }

        if (isValid) {
            if (typeof options.onsubmit === "function") {
                var formValues = Array.from(inputs).reduce(function (values, input) {
                    switch (input.type) {
                        case "radio":
                            if (input.matches(":checked")) {
                                values[input.name] = input.value;
                            }
                            break;
                        case "checkbox":
                            if (!input.matches(":checked")) {
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = ""
                                }
                                return values;
                            }
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case "file":
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }
                    return values;
                }, {});

                options.onsubmit(formValues);
            }
            else {
                formElement.submit();
            }
        }
    }
}