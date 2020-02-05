import tooltips from '../js/helpers/tooltips'

test('should create correct tooltip', () => {
    const received = tooltips({level: 1, attack: 10, defence: 40, health: 50});
    expect(received).toMatch('🎖1 ⚔10 🛡40 ❤50');
});