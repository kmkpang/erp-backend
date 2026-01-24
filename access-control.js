const AccessControl = require('accesscontrol');

let grantsObject = {
    super_user: {
        users: {
            'create:any': ['*'],
            'read:any': ['*'],
            'update:any': ['*'],
            'delete:any': ['*']
        }
    },
    manager: {
        employee: {
            'create:own': ['*'],
            'read:any': ['*'],
            'update:own': ['*'],
            'delete:own': ['*']
        }
    },
    employeee: {
        employee: {
            'read:own': ['*'],
        }
    }
};
const ac = new AccessControl(grantsObject);

module.exports = ac