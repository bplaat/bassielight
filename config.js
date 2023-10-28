// A basic setup example
const devices = [
    {
        'name': 'Lamp 1',
        'type': 'p56led',
        'addr': 1,
    },
    {
        'name': 'Lamp 2',
        'type': 'p56led',
        'addr': 7,
    }
];

const groups = [
    {
        'name': 'All',
        'devices': ['Lamp 1', 'Lamp 2'],
    },
    {
        'name': 'Lamp 1',
        'devices': ['Lamp 1'],
    },
    {
        'name': 'Lamp 2',
        'devices': ['Lamp 2'],
    }
];
