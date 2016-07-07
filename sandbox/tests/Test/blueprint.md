FORMAT: 1A

# Squalus Test API

Simple coverage of Squalus types

## Test Collection [/test/ObjectScalars]

### Get ObjectScalars [GET]

+ Response 200 (application/json)

        {
            "IntNullableEnumerated": 4,
            "IntNullable": null,
            "IntEnumerated": 193470,
            "UintEnumeratedRange": 7,
            "String": "donkey",
            "StringNullable": null,
            "StringNullableExplicit": "asdf",
            "StringEnumerated": "cheezburger",
            "Bool": false,
            "BoolEnumerated": true,
            "BoolNullable": null
        }

## Test Collection [/test/ObjectArrays]

### Get ObjectArrays [GET]

+ Response 200 (application/json)

        {
            "ArrayOfString": ["a", "b"],
            "NullableArrayOfString": null,
            "NullableArrayOfNullableString": ["c", null]
        }

## Test Collection [/test/ObjectSimple]

### Get ObjectSimple [GET]

+ Response 200 (application/json)

        {
            "Guid": "fed3931d-b1e1-439d-8284-efbe860f8230",
            "Float": 659.12,
            "Date": "2016-07-07T01:16:31+00:00"
        }

## Test Collection [/test/ObjectMultipleInheritanceArray]

### Get ObjectMultipleInheritanceArray [GET]

+ Response 200 (application/json)

        [
            {
                "OptionalString": "something",
                "Date": "2016-07-07T01:16:31+00:00"
            },
            {
                "OptionalBool": false,
                "Date": "2016-07-07T01:16:31+00:00"
            }
        ]

## Test Collection [/test/ObjectAnyArray]

### Get ObjectAnyArray [GET]

+ Response 200 (application/json)

        [
            {
                "FieldKey": "foo",
                "FieldOther": 39
            },
            {
                "FieldKey": "bar",
                "FieldOther": "2016-07-07T01:16:31+00:00"
            }
        ]

## Test Collection [/test/MapStringObject]

### Get MapStringObject [GET]

+ Response 200 (application/json)

        {
            "585a16c4-40e3-4e6f-9b4b-4c3d695387ca": {
                "Id": "585a16c4-40e3-4e6f-9b4b-4c3d695387ca",
                "Type": "blah",
                "B1": "foo"
            },
            "c66237fa-1457-4860-88a4-eda0d7ba8310": {
                "Id": "c66237fa-1457-4860-88a4-eda0d7ba8310",
                "Type": "flutter",
                "B2": 2
            }
        }

## Test Collection [/test/ObjectKnownInheritanceArray]

### Get ObjectKnownInheritanceArray [GET]

+ Response 200 (application/json)

        [
            {
                "Name": "Setting1",
                "Value": false,
                "Hive": "internal"
            },
            {
                "Name": "Setting2",
                "Value": 6,
                "Hive": "user"
            },
            {
                "Name": "Setting3",
                "Value": "val1",
                "Hive": "global"
            }
        ]

## Test Collection [/test/ObjectAll]

### Get ObjectAll [GET]

+ Response 200 (application/json)

        {
            "Scalars": {
                "IntNullableEnumerated": 4,
                "IntNullable": 299999983,
                "IntEnumerated": 56,
                "UintEnumeratedRange": 7,
                "String": "donkey",
                "StringNullable": "qwer",
                "StringNullableExplicit": null,
                "StringEnumerated": "I",
                "Bool": true,
                "BoolEnumerated": true,
                "BoolNullable": false
            },
            "Arrays": {
                "First": {
                    "ArrayOfString": ["c"],
                    "NullableArrayOfString": ["d"],
                    "NullableArrayOfNullableString": null
                },
                "Second": [
                    {
                        "Date": "2016-07-07T01:16:31+00:00"
                    }
                ]
            },
            "Intermediate": {
                "FieldKey": "foo",
                "FieldOther": -58
            },
            "Map1": {
                "a": "foo",
                "b": "bar"
            },
            "Map2": {
                "baea218c-326e-4a40-b10d-a6b415ffdba8": {
                    "Id": "baea218c-326e-4a40-b10d-a6b415ffdba8",
                    "Type": "blorg",
                    "B1": "foo"
                }
            },
            "Known": [
                {
                    "Name": "Setting1",
                    "Value": true,
                    "Hive": "global"
                }
            ],
            "Nested": [
                {
                    "int1": 2,
                    "int2": 8,
                    "bool": true,
                    "string1": "foo",
                    "string2": null
                },
                null
            ]
        }
