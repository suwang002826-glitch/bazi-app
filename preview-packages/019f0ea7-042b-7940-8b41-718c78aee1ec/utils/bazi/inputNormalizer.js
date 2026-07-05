const { resolveCalendar } = require('./calendarAdapter');

function normalizeBaziInput(form = {}) {
  const calendar = resolveCalendar(form);
  return {
    form: {
      ...form,
      birthDate: calendar.birthDate,
      calendarConversion: calendar.conversion
    },
    calendarConversion: calendar.conversion,
    warnings: calendar.warnings
  };
}

module.exports = {
  normalizeBaziInput
};
