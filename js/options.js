$(document).ready(function(){
	loadTestCode();
});

function loadTestCode() {
    $('#test_button1').click(function(e) {
        var $this = $(this);

        console.log('hi!',$this);
    });
}