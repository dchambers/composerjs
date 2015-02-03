'use strict';

function tenorDateHandler(input, output, current, modified) {
	if(typeof(input.tenorDate) == 'number') {
		output.tenor = input.tenorDate;
	}
	else {
		var nextTenor = 0;

		for(var businessDay of businessDays(input.businessDate, input.buisinessDays, input.businessHolidays)) {
			if(businessDay == input.tenorDate) {
				output.tenor = nextTenor;
			}

			nextTenor++;
		}
	}
}

tenorDateHandler.inputs = ['tenorDate', 'businessDate', 'buisinessDays', 'businessHolidays'];
tenorDateHandler.outputs = ['tenor'];

function* businessDays(businessDate, buisinessDays, businessHolidays) {
	// Note: the implementation for this would tick forward through the days starting from `businessDate` while
	// yielding all dates that are a valid day of the week ('buisinessDays') and not a holiday ('businessHolidays').
}

modules.exports = tenorDateHandler;
