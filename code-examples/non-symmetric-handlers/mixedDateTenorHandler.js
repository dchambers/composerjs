'use strict';

function mixedDateTenorHandler(input, output, current, modified) {
	if(typeof(input.mixedTenor) == 'number') {
		output.tenor = input.mixedTenor;
	}
	else {
		var nextTenor = 0;

		for(var businessDay of businessDays(input.businessDate, input.buisinessDays, input.businessHolidays)) {
			if(businessDay == input.mixedTenor) {
				output.tenor = nextTenor;
			}

			nextTenor++;
		}
	}
}

mixedDateTenorHandler.inputs = ['mixedTenor', 'businessDate', 'buisinessDays', 'businessHolidays'];
mixedDateTenorHandler.outputs = ['tenor'];

function* businessDays(businessDate, buisinessDays, businessHolidays) {
	// Note: the implementation for this would tick forward through the days starting from `businessDate` while
	// yielding all dates that are a valid day of the week ('buisinessDays') and not a holiday ('businessHolidays').
}

modules.exports = mixedDateTenorHandler;
