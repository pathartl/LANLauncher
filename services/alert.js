class AlertService {
    constructor(forms) {
    	this.forms = forms;
    	this.renderAlert();
    }

    renderAlert() {
    	var thisAlert = this;
		var templateHtml = compileTemplate('#alert-overlay-template', {forms: this.forms});

		$('.alert-overlay').html(templateHtml);

		this.forms.forEach(function(form) {
			$('form[name="' + form.name + '"]').on('submit', function(e) {
				e.preventDefault();
				// Call the callback for the form on submit
				var formSubmission = {
					name: form.name,
					fields: {}
				};

				form.fields.forEach(function(field) {
					formSubmission.fields[field.name] = $('form[name="' + form.name + '"] [name="' + field.name + '"]').val()
				});

				form.submit(formSubmission);
				thisAlert.dismiss();
			});
		});

		$('.alert-overlay').addClass('active');
    }

    dismiss() {
    	$('.alert-overlay').removeClass('active').html('');
    }

}

module.exports = AlertService;